/**
 * Connecteur numeroinconnu.fr
 *
 * ⚠️  AVERTISSEMENT JURIDIQUE
 * Pas d'API officielle — scraping HTML uniquement.
 * Vérifier les CGU de numeroinconnu.fr avant activation.
 * Risque de blocage IP si trop de requêtes.
 *
 * Dépendances : axios, cheerio (déjà dans package.json)
 *
 * TODO : Inspecter la structure HTML de la page d'un numéro sur numeroinconnu.fr
 *        et renseigner les sélecteurs CSS ci-dessous.
 */

const axios = require("axios");
const cheerio = require("cheerio");

/**
 * Convertit un numéro E.164 en format attendu par numeroinconnu.fr
 * Ex: "+33612345678" → "0612345678"
 */
function toLocalFormat(e164) {
  if (e164.startsWith("+33")) return "0" + e164.slice(3);
  return e164;
}

/**
 * @param {string} phone - Numéro E.164, ex: "+33612345678"
 * @returns {object} { status, score, label, reports, lastUpdated }
 */
async function checkNumeroinconnu(phone) {
  const localPhone = toLocalFormat(phone);
  const url = `https://www.numeroinconnu.fr/numero/${localPhone}`;

  try {
    const resp = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(resp.data);

    // ─── TODO : Renseigner les sélecteurs CSS réels ────────────────────────────
    // Inspecter la page https://www.numeroinconnu.fr/numero/0612345678
    // avec les DevTools navigateur (clic droit → Inspecter) pour trouver
    // les bons sélecteurs.
    //
    // Exemple (à vérifier) :
    // const score    = parseInt($(".danger-score .value").text().trim()) || null;
    // const label    = $(".call-type-label").first().text().trim() || null;
    // const reports  = parseInt($(".report-count").text().replace(/\D/g, "")) || null;
    // ──────────────────────────────────────────────────────────────────────────

    const score = null;   // TODO
    const label = null;   // TODO
    const reports = null; // TODO

    if (score === null && label === null) {
      return { status: "scraping_pending", message: "Sélecteurs CSS non encore renseignés" };
    }

    return {
      status: "ok",
      score,
      label,
      reports,
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    if (err.response?.status === 404) {
      return { status: "not_found", score: null, label: null, reports: null };
    }
    if (err.code === "ECONNABORTED") {
      return { status: "timeout", message: "numeroinconnu.fr n'a pas répondu à temps" };
    }
    return { status: "error", message: err.message };
  }
}

module.exports = { checkNumeroinconnu };
