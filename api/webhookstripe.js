const Stripe = require("stripe");
const admin  = require("firebase-admin");

if (!admin.apps.length) {
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const db     = admin.firestore();

async function buscarProduto(id) {
  const s = await db.collection("produtos").doc(id).get();
  return s.exists ? { id: s.id, ...s.data() } : null;
}

async function registrarCompra({ produtoId, usuarioId, nomeProduto, preco, paymentIntentId, stripeSessionId }) {
  if (!produtoId || !usuarioId) return;
  const p = await buscarProduto(produtoId).catch(() => null);
  await db.collection("compras").doc(`${usuarioId}_${produtoId}`).set({
    usuarioId,
    produtoId,
    nomeProduto:     nomeProduto || "",
    tipoProduto:     p?.tipo || "",
    urlArquivo:      p?.urlArquivo || p?.urlModelo || "",
    preco,
    paymentIntentId: paymentIntentId || "",
    stripeSessionId: stripeSessionId || "",
    status:          "aprovado",
    criadoEm:        admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  await db.collection("produtos").doc(produtoId).update({
    downloads: admin.firestore.FieldValue.increment(1),
    compras:   admin.firestore.FieldValue.increment(1),
  }).catch(() => {});
}

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ mensagem: "Método não permitido." });

  const buf = await buffer(req);
  const assinatura = req.headers["stripe-signature"];

  let evento;
  try {
    evento = stripe.webhooks.constructEvent(buf, assinatura, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return res.status(400).send(`Webhook error: ${e.message}`);
  }

  if (evento.type === "payment_intent.succeeded") {
    const pi = evento.data.object;
    await registrarCompra({
      ...pi.metadata,
      preco:           pi.amount / 100,
      paymentIntentId: pi.id,
    });
    await db.collection("pix_pendentes").doc(pi.id).delete().catch(() => {});
  }

  if (evento.type === "checkout.session.completed") {
    const session = evento.data.object;
    if (session.payment_status === "paid") {
      await registrarCompra({
        ...session.metadata,
        preco:           session.amount_total / 100,
        paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : "",
        stripeSessionId: session.id,
      });
    }
  }

  return res.status(200).json({ received: true });
}