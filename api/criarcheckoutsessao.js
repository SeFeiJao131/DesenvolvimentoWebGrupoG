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
    if (!produto?.ativo)  return res.status(404).json({ mensagem: "Produto não encontrado." });
    if (produto.gratuito) return res.status(400).json({ mensagem: "Produto é gratuito." });
    if (await jaComprou(uid, produtoId))
      return res.status(400).json({ mensagem: "Produto já adquirido." });

    const base = process.env.BASE_URL || `https://${req.headers.host}`;

    let customerId;
    const clienteSnap = await db.collection("stripe_customers").doc(uid).get();
    if (clienteSnap.exists) {
      customerId = clienteSnap.data().customerId;
    } else {
      const customer = await stripe.customers.create({
        email: email || "",
        metadata: { usuarioId: uid },
      });
      customerId = customer.id;
      await db.collection("stripe_customers").doc(uid).set({
        customerId,
        email:    email || "",
        criadoEm: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode:            "payment",
      customer:        customerId,
      customer_update: { address: "auto" },
      payment_method_types: ["card", "pix"],
      line_items: [
        {
          price_data: {
            currency:    "brl",
            unit_amount: Math.round(Number(produto.preco) * 100),
            product_data: {
              name:        produto.nome,
              description: [produto.resolucao, (produto.formato || []).join("/")]
                             .filter(Boolean).join(" · ") || undefined,
              images:      produto.urlImagem ? [produto.urlImagem] : [],
            },
          },
          quantity: 1,
        },
      ],
      metadata:             { produtoId, usuarioId: uid, nomeProduto: produto.nome },
      success_url:          `${base}/checkoutretorno.html?session_id={CHECKOUT_SESSION_ID}&produto=${produtoId}`,
      cancel_url:           `${base}/checkout.html?id=${produtoId}&cancelado=1`,
      allow_promotion_codes: true,
      invoice_creation:     { enabled: true },
      locale:               "pt-BR",
    });

    return res.status(200).json({ sessionId: session.id, url: session.url });

  } catch (e) {
    if (e.status) return res.status(e.status).json({ mensagem: e.mensagem });
    return res.status(500).json({ mensagem: e.message });
  }
}