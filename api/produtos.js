// api/produtos.js
const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:    process.env.FIREBASE_PROJECT_ID,
      clientEmail:  process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:   process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
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
    const { tipo, gratuito, destaque, limite = "24" } = req.query;

    const tiposValidos = ["textura", "modelo", "hdri"];
    if (tipo && !tiposValidos.includes(tipo.toLowerCase())) {
      return res.status(400).json({
        erro: `Tipo inválido. Use: ${tiposValidos.join(", ")}`,
      });
    }

    const limiteNum = Math.min(parseInt(limite) || 24, 100);

    let ref = db.collection("produtos").where("ativo", "==", true);

    if (tipo)     ref = ref.where("tipo",     "==", tipo.toLowerCase());
    if (destaque) ref = ref.where("destaque", "==", true);
    if (gratuito !== undefined)
                  ref = ref.where("gratuito", "==", gratuito === "true");

    ref = ref.orderBy("criadoEm", "desc").limit(limiteNum);

    const snap = await ref.get();

    const produtos = snap.docs.map(doc => {
      const d = doc.data();
      return {
        id:        doc.id,
        nome:      d.nome      || "",
        slug:      d.slug      || "",
        tipo:      d.tipo      || "",
        descricao: d.descricao || "",
        gratuito:  d.gratuito  ?? true,
        preco:     d.preco     ?? 0,
        resolucao: d.resolucao || "",
        formato:   d.formato   || [],
        tags:      d.tags      || [],
        urlImagem: d.urlImagem || "",
        downloads: d.downloads || 0,
        destaque:  d.destaque  ?? false,
        criadoEm:  d.criadoEm?.toDate().toISOString() || null,
      };
    });

    return res.status(200).json({
      total:   produtos.length,
      limite:  limiteNum,
      filtros: { tipo: tipo || null, gratuito: gratuito || null, destaque: destaque || null },
      produtos,
    });

  } catch (err) {
    console.error("Erro ao buscar produtos:", err);
    return res.status(500).json({ erro: "Erro interno do servidor." });
  }
};
