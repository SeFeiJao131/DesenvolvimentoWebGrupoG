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

// ── Helpers ────────────────────────────────────────────────────────────────────

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
  const s = await db.collection("compras")
    .where("usuarioId", "==", uid)
    .where("produtoId", "==", pid)
    .where("status", "==", "aprovado")
    .limit(1).get();
  return !s.empty;
}

function urlBase(req) {
  return process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
}

// ── POST /api/criar-payment-intent ────────────────────────────────────────────
app.post("/api/criar-payment-intent", verificarAuth, async (req, res) => {
  try {
    const { produtoId } = req.body;
    const { uid, email } = req.usuario;
    if (!produtoId) return res.status(400).json({ mensagem: "produtoId obrigatório." });

    const produto = await buscarProduto(produtoId);
    if (!produto?.ativo)  return res.status(404).json({ mensagem: "Produto não encontrado." });
    if (produto.gratuito) return res.status(400).json({ mensagem: "Produto é gratuito." });
    if (await jaComprou(uid, produtoId))
      return res.status(400).json({ mensagem: "Produto já adquirido." });

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

// ── POST /api/criar-checkout-session  (Stripe Checkout) ──────────────────────
app.post("/api/criar-checkout-session", verificarAuth, async (req, res) => {
  try {
    const { produtoId } = req.body;
    const { uid, email } = req.usuario;
    if (!produtoId) return res.status(400).json({ mensagem: "produtoId obrigatório." });

    const produto = await buscarProduto(produtoId);
    if (!produto?.ativo)  return res.status(404).json({ mensagem: "Produto não encontrado." });
    if (produto.gratuito) return res.status(400).json({ mensagem: "Produto é gratuito." });
    if (await jaComprou(uid, produtoId))
      return res.status(400).json({ mensagem: "Produto já adquirido." });

    const base = urlBase(req);

    // Cria ou recupera Customer Stripe vinculado ao usuário Firebase
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
        email: email || "",
        criadoEm: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      customer_update: { address: "auto" },
      payment_method_types: ["card", "pix"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            unit_amount: Math.round(Number(produto.preco) * 100),
            product_data: {
              name: produto.nome,
              description: [produto.resolucao, (produto.formato || []).join("/")]
                .filter(Boolean).join(" · ") || undefined,
              images: produto.urlImagem ? [produto.urlImagem] : [],
            },
          },
          quantity: 1,
        },
      ],
      metadata: { produtoId, usuarioId: uid, nomeProduto: produto.nome },
      success_url: `${base}/checkout-retorno.html?session_id={CHECKOUT_SESSION_ID}&produto=${produtoId}`,
      cancel_url:  `${base}/checkout.html?id=${produtoId}&cancelado=1`,
      allow_promotion_codes: true,
      invoice_creation: { enabled: true },
      locale: "pt-BR",
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (e) { res.status(500).json({ mensagem: e.message }); }
});

// ── GET /api/verificar-sessao ─────────────────────────────────────────────────
app.get("/api/verificar-sessao", verificarAuth, async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ mensagem: "session_id obrigatório." });

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["payment_intent"],
    });

    if (session.payment_status === "paid") {
      const { produtoId, usuarioId, nomeProduto } = session.metadata;
      if (usuarioId !== req.usuario.uid)
        return res.status(403).json({ mensagem: "Sessão não pertence a este usuário." });

      const produto = await buscarProduto(produtoId).catch(() => null);

      await db.collection("compras").doc(`${usuarioId}_${produtoId}`).set({
        usuarioId, produtoId,
        nomeProduto:     nomeProduto || "",
        tipoProduto:     produto?.tipo || "",
        urlArquivo:      produto?.urlArquivo || produto?.urlModelo || "",
        preco:           session.amount_total / 100,
        stripeSessionId: session.id,
        paymentIntentId: typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || "",
        status: "aprovado",
        criadoEm: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      await db.collection("produtos").doc(produtoId).update({
        downloads: admin.firestore.FieldValue.increment(1),
        compras:   admin.firestore.FieldValue.increment(1),
      }).catch(() => {});

      res.json({
        pago: true, produtoId, nomeProduto,
        urlArquivo: produto?.urlArquivo || produto?.urlModelo || null,
      });
    } else {
      res.json({ pago: false, status: session.payment_status });
    }
  } catch (e) { res.status(500).json({ mensagem: e.message }); }
});

// ── POST /api/criar-pix ───────────────────────────────────────────────────────
app.post("/api/criar-pix", verificarAuth, async (req, res) => {
  try {
    const { produtoId } = req.body;
    const { uid, email } = req.usuario;

    const produto = await buscarProduto(produtoId);
    if (!produto?.ativo || produto.gratuito)
      return res.status(404).json({ mensagem: "Produto inválido." });
    if (await jaComprou(uid, produtoId))
      return res.status(400).json({ mensagem: "Produto já adquirido." });

    const pi = await stripe.paymentIntents.create({
      amount: Math.round(Number(produto.preco) * 100),
      currency: "brl",
      payment_method_types: ["pix"],
      metadata: { produtoId, usuarioId: uid, nomeProduto: produto.nome },
      receipt_email: email || "",
    });

    const pix = pi.next_action?.pix_display_qr_code;
    await db.collection("pix_pendentes").doc(pi.id).set({
      usuarioId: uid, produtoId, status: "pendente",
      criadoEm: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      paymentIntentId: pi.id,
      clientSecret:    pi.client_secret,
      qrCode:          pix?.data         || null,
      qrCodeBase64:    pix?.image_url_png || null,
      copiaCola:       pix?.data         || null,
      expiresIn:       1800,
    });
  } catch (e) { res.status(500).json({ mensagem: e.message }); }
});

// ── GET /api/verificar-pix ────────────────────────────────────────────────────
app.get("/api/verificar-pix", verificarAuth, async (req, res) => {
  try { res.json({ pago: await jaComprou(req.usuario.uid, req.query.produtoId) }); }
  catch { res.json({ pago: false }); }
});

// ── POST /api/webhook-stripe ──────────────────────────────────────────────────
app.post("/api/webhook-stripe", async (req, res) => {
  let evento;
  try {
    evento = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (e) { return res.status(400).send(`Webhook error: ${e.message}`); }

  const registrarCompra = async (dados) => {
    const { produtoId, usuarioId, nomeProduto, preco, paymentIntentId, stripeSessionId } = dados;
    if (!produtoId || !usuarioId) return;
    const p = await buscarProduto(produtoId).catch(() => null);
    await db.collection("compras").doc(`${usuarioId}_${produtoId}`).set({
      usuarioId, produtoId,
      nomeProduto:    nomeProduto || "",
      tipoProduto:    p?.tipo || "",
      urlArquivo:     p?.urlArquivo || p?.urlModelo || "",
      preco, paymentIntentId: paymentIntentId || "", stripeSessionId: stripeSessionId || "",
      status: "aprovado",
      criadoEm: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    await db.collection("produtos").doc(produtoId).update({
      downloads: admin.firestore.FieldValue.increment(1),
      compras:   admin.firestore.FieldValue.increment(1),
    }).catch(() => {});
  };

  if (evento.type === "payment_intent.succeeded") {
    const pi = evento.data.object;
    await registrarCompra({
      ...pi.metadata,
      preco: pi.amount / 100,
      paymentIntentId: pi.id,
    });
    await db.collection("pix_pendentes").doc(pi.id).delete().catch(() => {});
  }

  if (evento.type === "checkout.session.completed") {
    const session = evento.data.object;
    if (session.payment_status === "paid") {
      await registrarCompra({
        ...session.metadata,
        preco: session.amount_total / 100,
        paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : "",
        stripeSessionId: session.id,
      });
    }
  }

  res.json({ received: true });
});

// ── GET /api/minhas-compras ───────────────────────────────────────────────────
app.get("/api/minhas-compras", verificarAuth, async (req, res) => {
  try {
    const s = await db.collection("compras")
      .where("usuarioId", "==", req.usuario.uid)
      .where("status", "==", "aprovado")
      .orderBy("criadoEm", "desc")
      .get();
    res.json({ compras: s.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (e) { res.status(500).json({ mensagem: e.message }); }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(` Servidor rodando em http://localhost:${PORT}`));