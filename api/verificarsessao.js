const Stripe = require("stripe");
const admin  = require("firebase-admin");

if (!admin.apps.length) {
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const db     = admin.firestore();

async function verificarAuth(req) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) throw { status: 401, mensagem: "Token ausente." };
  try {
    return await admin.auth().verifyIdToken(token);
  } catch {
    throw { status: 401, mensagem: "Token inválido." };
  }
}

async function buscarProduto(id) {
  const s = await db.collection("produtos").doc(id).get();
  return s.exists ? { id: s.id, ...s.data() } : null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")    return res.status(405).json({ mensagem: "Método não permitido." });

  try {
    const usuario = await verificarAuth(req);
    const { session_id } = req.query;

    if (!session_id) return res.status(400).json({ mensagem: "session_id obrigatório." });

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["payment_intent"],
    });

    if (session.payment_status === "paid") {
      const { produtoId, usuarioId, nomeProduto } = session.metadata;

      if (usuarioId !== usuario.uid)
        return res.status(403).json({ mensagem: "Sessão não pertence a este usuário." });

      const produto = await buscarProduto(produtoId).catch(() => null);

      await db.collection("compras").doc(`${usuarioId}_${produtoId}`).set({
        usuarioId,
        produtoId,
        nomeProduto:     nomeProduto || "",
        tipoProduto:     produto?.tipo || "",
        urlArquivo:      produto?.urlArquivo || produto?.urlModelo || "",
        preco:           session.amount_total / 100,
        stripeSessionId: session.id,
        paymentIntentId: typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || "",
        status:   "aprovado",
        criadoEm: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      await db.collection("produtos").doc(produtoId).update({
        downloads: admin.firestore.FieldValue.increment(1),
        compras:   admin.firestore.FieldValue.increment(1),
      }).catch(() => {});

      return res.status(200).json({
        pago:       true,
        produtoId,
        nomeProduto,
        urlArquivo: produto?.urlArquivo || produto?.urlModelo || null,
      });

    } else {
      return res.status(200).json({ pago: false, status: session.payment_status });
    }

  } catch (e) {
    if (e.status) return res.status(e.status).json({ mensagem: e.mensagem });
    return res.status(500).json({ mensagem: e.message });
  }
}