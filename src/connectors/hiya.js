/**
 * Connecteur Hiya
 *
 * API officielle : GET https://api.hiya.com/reputation
 * Paramètre : phones=%2b33XXXXXXXXX (E.164, "+" encodé en %2b)
 * Max 100 numéros par requête.
 *
 * Prérequis :
 *   1. Créer un compte Hiya Developer et signer l'accord de service
 *   2. Enregistrer votre entreprise via POST /business
 *   3. Enregistrer vos numéros via POST /business/{id}/phone-numbers
 *   4. Renseigner HIYA_API_KEY (ou HIYA_CLIENT_ID + HIYA_CLIENT_SECRET) dans .env
 */

const axios = require("axios");

const BASE_URL = "https://api.hiya.com";
let oauthToken = null;
let oauthExpiry = 0;

async function getAuthHeader() {
  const mode = process.env.HIYA_AUTH_MODE || "apikey";

  if (mode === "oauth2") {
    if (Date.now() < oauthExpiry - 30000) {
      return { Authorization: `Bearer ${oauthToken}` };
    }
    const resp = await axios.post(
      process.env.HIYA_TOKEN_URL,
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.HIYA_CLIENT_ID,
        client_secret: process.env.HIYA_CLIENT_SECRET,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    oauthToken = resp.data.access_token;
    oauthExpiry = Date.now() + (resp.data.expires_in || 3600) * 1000;
    return { Authorization: `Bearer ${oauthToken}` };
  }

  // Mode apikey (défaut)
  return { Authorization: `ApiKey ${process.env.HIYA_API_KEY}` };
}

/**
 * @param {string} phone - Numéro E.164, ex: "+33612345678"
 * @returns {object} { status, score, label, reports, lastUpdated }
 */
async function checkHiya(phone) {
  if (!process.env.HIYA_API_KEY && !process.env.HIYA_CLIENT_ID) {
    return { status: "unconfigured", message: "Clé API Hiya non renseignée dans .env" };
  }

  try {
    const authHeader = await getAuthHeader();
    // Le "+" doit être encodé en %2b (pas %2B) — spécificité de l'API Hiya
    const encodedPhone = phone.replace("+", "%2b");

    const resp = await axios.get(`${BASE_URL}/reputation`, {
      params: { phones: encodedPhone },
      headers: {
        ...authHeader,
        "Content-Type": "application/json",
      },
      timeout: 8000,
    });

    // Adapter ce mapping à la réponse réelle de votre tenant Hiya
    // Inspecter resp.data sur vos premiers appels pour confirmer les chemins exacts
    const entry = resp.data?.results?.[0] || resp.data?.entries?.[0];

    if (!entry) {
      return { status: "not_found", score: null, label: null, reports: null, lastUpdated: null };
    }

    return {
      status: "ok",
      score: entry.reputation?.score ?? null,
      label: entry.reputation?.category ?? entry.reputation?.flagStatus ?? null,
      reports: entry.reputation?.reportCount ?? null,
      lastUpdated: entry.reputation?.updatedAt ?? new Date().toISOString(),
    };
  } catch (err) {
    const status = err.response?.status;
    if (status === 401 || status === 403) {
      return { status: "auth_error", message: "Clé API invalide ou expirée" };
    }
    if (status === 404) {
      return { status: "not_found", score: null, label: null, reports: null };
    }
    return { status: "error", message: err.message };
  }
}

module.exports = { checkHiya };
