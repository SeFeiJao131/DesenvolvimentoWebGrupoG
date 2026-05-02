// api/produtos/[id].js
// GET /api/produtos/abc123

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore }                  from "firebase-admin/firestore";

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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ erro: "Método não permitido. Use GET." });

  const { id } = req.query;

  if (!id) return res.status(400).json({ erro: "ID não informado." });

  try {
    const snap = await db.collection("produtos").doc(id).get();

    if (!snap.exists) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    const d = snap.data();

    if (!d.ativo) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    return res.status(200).json({
      id:        snap.id,
      nome:      d.nome       || "",
      slug:      d.slug       || "",
      tipo:      d.tipo       || "",
      descricao: d.descricao  || "",
      gratuito:  d.gratuito   ?? true,
      preco:     d.preco      ?? 0,
      resolucao: d.resolucao  || "",
      formato:   d.formato    || [],
      suporte:   d.suporte    || [],
      render:    d.render     || [],
      categorias:d.categorias || [],
      tags:      d.tags       || [],
      urlImagem: d.urlImagem  || "",
      imagens:   d.imagens    || [],
      downloads: d.downloads  || 0,
      destaque:  d.destaque   ?? false,
      criadoEm:  d.criadoEm?.toDate().toISOString() || null,
      atualizadoEm: d.atualizadoEm?.toDate().toISOString() || null,
    });

  } catch (err) {
    console.error("Erro ao buscar produto:", err);
    return res.status(500).json({ erro: "Erro interno do servidor." });
  }
}
