// api/stats.js
const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ erro: "Método não permitido. Use GET." });

  try {
    const snap = await db.collection("produtos").where("ativo", "==", true).get();

    let totalDownloads = 0;
    let totalTexturas  = 0;
    let totalModelos   = 0;
    let totalHdris     = 0;
    let totalGratuitos = 0;

    snap.docs.forEach(doc => {
      const d = doc.data();
      totalDownloads += d.downloads || 0;
      if (d.tipo === "textura") totalTexturas++;
      if (d.tipo === "modelo")  totalModelos++;
      if (d.tipo === "hdri")    totalHdris++;
      if (d.gratuito)           totalGratuitos++;
    });

    return res.status(200).json({
      totalProdutos:  snap.size,
      totalTexturas,
      totalModelos,
      totalHdris,
      totalGratuitos,
      totalDownloads,
      atualizadoEm:   new Date().toISOString(),
    });

  } catch (err) {
    console.error("Erro ao buscar stats:", err);
    return res.status(500).json({ erro: "Erro interno do servidor." });
  }
};
