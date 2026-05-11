require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const Stripe  = require("stripe");
const admin   = require("firebase-admin");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const app    = express();

if (!admin.apps.length) {
  const sa = require(process.env.FIREBASE_SERVICE_ACCOUNT || "./serviceAccountKey.json");
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

app.use(cors({ origin: true }));
app.use("/api/webhook-stripe", express.raw({ type: "application/json" }));
app.use(express.json());

async function verificarAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ mensagem: "Token ausente." });
  try { req.usuario = await admin.auth().verifyIdToken(token); next(); }
  catch { res.status(401).json({ mensagem: "Token inválido." }); }
}

async function buscarProduto(id) {
  const s = await db.collection("produtos").doc(id).get();
  return s.exists ? { id: s.id, ...s.data() } : null;
}

async function jaComprou(uid, pid) {
  const s = await db.collection("compras").where("usuarioId","==",uid).where("produtoId","==",pid).where("status","==","aprovado").limit(1).get();
  return !s.empty;
}

// POST /api/criar-payment-intent
app.post("/api/criar-payment-intent", verificarAuth, async (req, res) => {
  try {
    const { produtoId } = req.body;
    const { uid, email } = req.usuario;
    if (!produtoId) return res.status(400).json({ mensagem: "produtoId obrigatório." });
    const produto = await buscarProduto(produtoId);
    if (!produto?.ativo) return res.status(404).json({ mensagem: "Produto não encontrado." });
    if (produto.gratuito) return res.status(400).json({ mensagem: "Produto é gratuito." });
    if (await jaComprou(uid, produtoId)) return res.status(400).json({ mensagem: "Produto já adquirido." });

    const pi = await stripe.paymentIntents.create({
      amount: Math.round(Number(produto.preco) * 100),
      currency: "brl",
      metadata: { produtoId, usuarioId: uid, nomeProduto: produto.nome },
      receipt_email: email || "",
      automatic_payment_methods: { enabled: true },
    });
    res.json({ clientSecret: pi.client_secret });
  } catch (e) { res.status(500).json({ mensagem: e.message }); }
});

// POST /api/criar-pix
app.post("/api/criar-pix", verificarAuth, async (req, res) => {
  try {
    const { produtoId } = req.body;
    const { uid, email } = req.usuario;
    const produto = await buscarProduto(produtoId);
    if (!produto?.ativo || produto.gratuito) return res.status(404).json({ mensagem: "Produto inválido." });
    if (await jaComprou(uid, produtoId)) return res.status(400).json({ mensagem: "Produto já adquirido." });

    const pi = await stripe.paymentIntents.create({
      amount: Math.round(Number(produto.preco) * 100),
      currency: "brl",
      payment_method_types: ["pix"],
      metadata: { produtoId, usuarioId: uid, nomeProduto: produto.nome },
      receipt_email: email || "",
    });

    const pix = pi.next_action?.pix_display_qr_code;
    await db.collection("pix_pendentes").doc(pi.id).set({ usuarioId: uid, produtoId, status: "pendente", criadoEm: admin.firestore.FieldValue.serverTimestamp() });

    res.json({ paymentIntentId: pi.id, clientSecret: pi.client_secret, qrCode: pix?.data || null, qrCodeBase64: pix?.image_url_png || null, copiaCola: pix?.data || null, expiresIn: 1800 });
  } catch (e) { res.status(500).json({ mensagem: e.message }); }
});

// GET /api/verificar-pix
app.get("/api/verificar-pix", verificarAuth, async (req, res) => {
  try { res.json({ pago: await jaComprou(req.usuario.uid, req.query.produtoId) }); }
  catch { res.json({ pago: false }); }
});

// POST /api/webhook-stripe
app.post("/api/webhook-stripe", async (req, res) => {
  let evento;
  try { evento = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET); }
  catch (e) { return res.status(400).send(`Webhook error: ${e.message}`); }

  if (evento.type === "payment_intent.succeeded") {
    const pi = evento.data.object;
    const { produtoId, usuarioId, nomeProduto } = pi.metadata;
    if (produtoId && usuarioId) {
      const p = await buscarProduto(produtoId).catch(() => null);
      await db.collection("compras").doc(`${usuarioId}_${produtoId}`).set({
        usuarioId, produtoId, nomeProduto: nomeProduto || "", tipoProduto: p?.tipo || "",
        urlArquivo: p?.urlArquivo || p?.urlModelo || "",
        preco: pi.amount / 100, paymentIntentId: pi.id, status: "aprovado",
        criadoEm: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      await db.collection("produtos").doc(produtoId).update({ downloads: admin.firestore.FieldValue.increment(1), compras: admin.firestore.FieldValue.increment(1) });
      await db.collection("pix_pendentes").doc(pi.id).delete().catch(() => {});
    }
  }
  res.json({ received: true });
});

// GET /api/minhas-compras
app.get("/api/minhas-compras", verificarAuth, async (req, res) => {
  try {
    const s = await db.collection("compras").where("usuarioId","==",req.usuario.uid).where("status","==","aprovado").orderBy("criadoEm","desc").get();
    res.json({ compras: s.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e) { res.status(500).json({ mensagem: e.message }); }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Servidor rodando em http://localhost:${PORT}`));