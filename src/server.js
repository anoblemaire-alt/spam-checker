require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { checkHiya } = require("./connectors/hiya");
const { checkOrange } = require("./connectors/orange");
const { checkNumeroinconnu } = require("./connectors/numeroinconnu");

const app = express();
const PORT = process.env.PORT || 100000;
const CACHE_TTL = parseInt(process.env.CACHE_TTL || "3600") * 1000;

// ─── Middlewares ─────────────────────────────────────────────────────────────

app.use(cors({ origin: "*" }));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "Trop de requêtes. Réessayez dans une minute." },
});
app.use("/api", limiter);

// ─── Cache en mémoire ────────────────────────────────────────────────────────
// En production multi-instances, remplacer par Redis :
//   npm install ioredis → const Redis = require("ioredis"); const cache = new Redis();

const cache = new Map();

function cacheKey(source, phone) {
  return `${source}:${phone}`;
}

function fromCache(source, phone) {
  const entry = cache.get(cacheKey(source, phone));
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(cacheKey(source, phone));
    return null;
  }
  return entry.data;
}

function toCache(source, phone, data) {
  cache.set(cacheKey(source, phone), { data, ts: Date.now() });
}

// ─── Normalisation du numéro ─────────────────────────────────────────────────

function normalizePhone(raw) {
  if (!raw) return null;
  const cleaned = String(raw).trim().replace(/[\s\-\.\(\)]/g, "");
  if (/^0[1-9]\d{8}$/.test(cleaned)) return "+33" + cleaned.slice(1);
  if (/^\+33[1-9]\d{8}$/.test(cleaned)) return cleaned;
  return null;
}

// ─── Score global ────────────────────────────────────────────────────────────

function globalScore(sources) {
  const scores = Object.values(sources)
    .filter((s) => s && s.status === "ok" && s.score !== null)
    .map((s) => s.score);
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// ─── Routes par source ───────────────────────────────────────────────────────

async function resolveSource(source, phone, fetcher) {
  const cached = fromCache(source, phone);
  if (cached) return cached;
  const result = await fetcher(phone);
  toCache(source, phone, result);
  return result;
}

app.get("/api/hiya", async (req, res) => {
  const phone = normalizePhone(req.query.phone);
  if (!phone) return res.status(400).json({ error: "Numéro invalide. Format attendu : 06XXXXXXXX ou +336XXXXXXXX" });
  try {
    const data = await resolveSource("hiya", phone, checkHiya);
    res.json({ phone, source: "hiya", ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/orange", async (req, res) => {
  const phone = normalizePhone(req.query.phone);
  if (!phone) return res.status(400).json({ error: "Numéro invalide." });
  try {
    const data = await resolveSource("orange", phone, checkOrange);
    res.json({ phone, source: "orange", ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/numeroinconnu", async (req, res) => {
  const phone = normalizePhone(req.query.phone);
  if (!phone) return res.status(400).json({ error: "Numéro invalide." });
  try {
    const data = await resolveSource("numeroinconnu", phone, checkNumeroinconnu);
    res.json({ phone, source: "numeroinconnu", ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Route agrégée ───────────────────────────────────────────────────────────

app.get("/api/check", async (req, res) => {
  const phone = normalizePhone(req.query.phone);
  if (!phone) return res.status(400).json({ error: "Numéro invalide. Format attendu : 06XXXXXXXX ou +336XXXXXXXX" });

  const [hiya, orange, numeroinconnu] = await Promise.allSettled([
    resolveSource("hiya", phone, checkHiya),
    resolveSource("orange", phone, checkOrange),
    resolveSource("numeroinconnu", phone, checkNumeroinconnu),
  ]);

  const sources = {
    hiya: hiya.status === "fulfilled" ? hiya.value : { status: "error", message: hiya.reason?.message },
    orange: orange.status === "fulfilled" ? orange.value : { status: "error", message: orange.reason?.message },
    numeroinconnu: numeroinconnu.status === "fulfilled" ? numeroinconnu.value : { status: "error", message: numeroinconnu.reason?.message },
  };

  res.json({
    phone,
    globalScore: globalScore(sources),
    sources,
  });
});

// ─── Démarrage ───────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅  Backend spam-checker démarré sur http://localhost:${PORT}`);
  console.log(`   Routes disponibles :`);
  console.log(`   GET /api/check?phone=0612345678`);
  console.log(`   GET /api/hiya?phone=0612345678`);
  console.log(`   GET /api/orange?phone=0612345678`);
  console.log(`   GET /api/numeroinconnu?phone=0612345678`);
});
