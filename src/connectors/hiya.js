const axios = require("axios");

async function checkHiya(phone) {
  if (!process.env.HUHU_API_KEY) {
    return { status: "unconfigured", message: "Clé API Huhu non renseignée" };
  }
  try {
    const resp = await axios.get(
      `https://num.huhu.fr/api/check/${encodeURIComponent(phone)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.HUHU_API_KEY}`,
        },
        timeout: 8000,
      }
    );
    const d = resp.data.data;
    return {
      status: "ok",
      score: d.huhu?.spamScore ?? null,
      label: d.huhu?.spamType ?? null,
      reports: d.truecaller?.numReports ?? null,
      lastUpdated: new Date().toLocaleString("fr-FR"),
    };
  } catch (err) {
    return { status: "error", message: err.response?.data?.message || err.message };
  }
}

module.exports = { checkHiya };
