import Stripe from "stripe";
import admin  from "firebase-admin";

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

async function jaComprou(uid, pid) {
  const s = await db.collection("compras")
    .where("usuarioId", "==", uid)
    .where("produtoId", "==", pid)
    .where("status",    "==", "aprovado")
    .limit(1).get();
  return !s.empty;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")   return res.status(405).json({ mensagem: "Método não permitido." });

  try {
    const usuario = await verificarAuth(req);
    const { uid, email } = usuario;
    const { produtoId }  = req.body;

    if (!produtoId) return res.status(400).json({ mensagem: "produtoId obrigatório." });

    const produto = await buscarProduto(produtoId);
    if (!produto?.ativo || produto.gratuito)
      return res.status(404).json({ mensagem: "Produto inválido." });
    if (await jaComprou(uid, produtoId))
      return res.status(400).json({ mensagem: "Produto já adquirido." });

    const pi = await stripe.paymentIntents.create({
      amount:               Math.round(Number(produto.preco) * 100),
      currency:             "brl",
      payment_method_types: ["pix"],
      metadata:             { produtoId, usuarioId: uid, nomeProduto: produto.nome },
      receipt_email:        email || "",
    });

    const pix = pi.next_action?.pix_display_qr_code;

    await db.collection("pix_pendentes").doc(pi.id).set({
      usuarioId: uid,
      produtoId,
      status:    "pendente",
      criadoEm:  admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      paymentIntentId: pi.id,
      clientSecret:    pi.client_secret,
      qrCode:          pix?.data         || null,
      qrCodeBase64:    pix?.image_url_png || null,
      copiaCola:       pix?.data         || null,
      expiresIn:       1800,
    });

  } catch (e) {
    if (e.status) return res.status(e.status).json({ mensagem: e.mensagem });
    return res.status(500).json({ mensagem: e.message });
  }
}