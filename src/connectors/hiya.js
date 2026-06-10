const axios = require("axios");

async function checkHiya(phone) {
  if (!process.env.HUHU_API_KEY) {
    return { status: "unconfigured", message: "Clé API Huhu non renseignée" };
  }
  try {
    const resp = await axios.post(
      "https://api.huhu.fr/v1/check",
      { phone },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUHU_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 8000,
      }
    );
    const d = resp.data;
    return {
      status: "ok",
      score: d.score ?? null,
      label: d.tag ?? null,
      reports: d.reports ?? null,
      lastUpdated: new Date().toLocaleString("fr-FR"),
    };
  } catch (err) {
    return { status: "error", message: err.message };
  }
}

module.exports = { checkHiya };
