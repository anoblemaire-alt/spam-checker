/**
 * Connecteur Orange
 *
 * ⚠️  AVERTISSEMENT JURIDIQUE
 * Orange ne fournit pas d'API publique pour ses données anti-spam.
 * "Orange Téléphone" est une app communautaire iOS/Android.
 * Implémenter ce connecteur nécessite soit :
 *   (a) Du reverse-engineering du trafic réseau de l'app Orange Téléphone
 *       → Inspecter avec un proxy (ex: Charles, mitmproxy) pour trouver l'endpoint backend
 *   (b) Du scraping HTML du site Orange associé
 * Ces deux approches peuvent violer les CGU d'Orange et le RGPD.
 * Consulter votre service juridique avant implémentation.
 *
 * TODO : Une fois l'endpoint trouvé, implémenter ici et retirer le statut "unavailable"
 */

const axios = require("axios");

/**
 * @param {string} phone - Numéro E.164, ex: "+33612345678"
 * @returns {object} { status, score, label, reports, lastUpdated }
 */
async function checkOrange(phone) {
  // TODO : Remplacer par l'appel réel une fois l'endpoint identifié
  // Exemple de structure attendue après implémentation :
  //
  // const resp = await axios.get(`https://[ENDPOINT_A_TROUVER]/${phone}`, {
  //   headers: { /* headers nécessaires */ },
  //   timeout: 8000,
  // });
  // return {
  //   status: "ok",
  //   score: resp.data.score,
  //   label: resp.data.label,
  //   reports: resp.data.reportCount,
  //   lastUpdated: resp.data.updatedAt,
  // };

  return {
    status: "unavailable",
    message: "Connecteur Orange non implémenté — voir commentaires dans le fichier source",
  };
}

module.exports = { checkOrange };
