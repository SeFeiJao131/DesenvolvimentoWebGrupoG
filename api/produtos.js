// api/produtos.js
// GET /api/produtos
// GET /api/produtos?tipo=textura
// GET /api/produtos?gratuito=true
// GET /api/produtos?destaque=true
// GET /api/produtos?limite=20
// GET /api/produtos?tipo=modelo&gratuito=true

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore }                  from "firebase-admin/firestore";

// ── Inicializa Firebase Admin (uma vez) ───────────────────
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

export default async function handler(req, res) {
  // ── CORS — permite qualquer origem ────────────────────────
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ erro: "Método não permitido. Use GET." });

  try {
    const { tipo, gratuito, destaque, limite = "24" } = req.query;

    // ── Valida parâmetros ──────────────────────────────────
    const tiposValidos = ["textura", "modelo", "hdri"];
    if (tipo && !tiposValidos.includes(tipo.toLowerCase())) {
      return res.status(400).json({
        erro: `Tipo inválido. Use: ${tiposValidos.join(", ")}`,
      });
    }

    const limiteNum = Math.min(parseInt(limite) || 24, 100); // máx 100

    // ── Monta query no Firestore ───────────────────────────
    let ref = db.collection("produtos").where("ativo", "==", true);

    if (tipo)     ref = ref.where("tipo",      "==", tipo.toLowerCase());
    if (destaque) ref = ref.where("destaque",  "==", true);
    if (gratuito !== undefined)
                  ref = ref.where("gratuito",  "==", gratuito === "true");

    ref = ref.orderBy("criadoEm", "desc").limit(limiteNum);

    const snap = await ref.get();

    const produtos = snap.docs.map(doc => {
      const d = doc.data();
      return {
        id:        doc.id,
        nome:      d.nome       || "",
        slug:      d.slug       || "",
        tipo:      d.tipo       || "",
        descricao: d.descricao  || "",
        gratuito:  d.gratuito   ?? true,
        preco:     d.preco      ?? 0,
        resolucao: d.resolucao  || "",
        formato:   d.formato    || [],
        tags:      d.tags       || [],
        urlImagem: d.urlImagem  || "",
        downloads: d.downloads  || 0,
        destaque:  d.destaque   ?? false,
        criadoEm:  d.criadoEm?.toDate().toISOString() || null,
      };
    });

    return res.status(200).json({
      total:     produtos.length,
      limite:    limiteNum,
      filtros:   { tipo: tipo || null, gratuito: gratuito || null, destaque: destaque || null },
      produtos,
    });

  } catch (err) {
    console.error("Erro ao buscar produtos:", err);
    return res.status(500).json({ erro: "Erro interno do servidor." });
  }
}
