import { app } from "../nucleo/config.js";
import { buscarProdutoPorId } from "../nucleo/db.js";
import { getAuth, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

/* ── CONFIGURAÇÃO ─────────────────────────────────────── */
const STRIPE_PUBLIC_KEY = "pk_test_51TVx7JJuBe8PlzFoQKq7vzU5CSfF9MxgwgFkIcZ14q5JxrvhRhppocs5HbCrKVhGH9g15pIDCGkVkjQcprBPmGVc00bzHBJOHw";
const API_BASE = "/api";
const MODO_CARTAO = "checkout";
/* ──────────────────────────────────────────────────────── */

const auth = getAuth(app);
const db   = getFirestore(app);

const params    = new URLSearchParams(window.location.search);
const produtoId = params.get("id");
const cancelado = params.get("cancelado");

let stripe, elements, paymentElement, produto, usuario;

/* ── Helpers ──────────────────────────────────────────── */
const $       = id => document.getElementById(id);
const setText = (id, v) => { const el = $(id); if (el) el.textContent = v; };
const fmtPreco = v => `R$ ${Number(v).toFixed(2).replace(".", ",")}`;

/* ── Init ─────────────────────────────────────────────── */
if (!produtoId) {
  erroFatal("Produto não encontrado.");
} else {
  init();
}

async function init() {
  try {
    produto = await buscarProdutoPorId(produtoId);
    if (!produto || !produto.ativo) { erroFatal("Produto não encontrado."); return; }
    if (produto.gratuito)           { erroFatal("Este produto é gratuito. Baixe direto na página do produto."); return; }

    preencherResumo(produto);

    if (cancelado === "1") {
      mostrarErroInline("Pagamento cancelado. Você pode tentar novamente quando quiser.");
    }

    await carregarStripeJS();

    onAuthStateChanged(auth, async (u) => {
      if (!u) {
        location.href = `login.html?redirect=${encodeURIComponent(location.href)}`;
        return;
      }
      usuario = u;
      await setupFormulario();
    });

  } catch (e) {
    erroFatal("Erro ao carregar checkout. Tente novamente.");
  }
}

/* ── Carrega Stripe.js dinamicamente ─────────────────── */
function carregarStripeJS() {
  return new Promise((ok, fail) => {
    if (window.Stripe) { ok(); return; }
    const s = document.createElement("script");
    s.src = "https://js.stripe.com/v3/";
    s.onload = ok;
    s.onerror = () => fail(new Error("Falha ao carregar Stripe.js"));
    document.head.appendChild(s);
  });
}

/* ── Configura formulário após login ─────────────────── */
async function setupFormulario() {
  try {
    stripe = window.Stripe(STRIPE_PUBLIC_KEY);

    if (MODO_CARTAO === "element") {
      const token = await usuario.getIdToken();
      const res = await fetch(`${API_BASE}/criarpagamento`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ produtoId, usuarioId: usuario.uid }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.mensagem || `Erro ${res.status}`);
      }
      const { clientSecret } = await res.json();

      elements = stripe.elements({
        clientSecret,
        appearance: {
          theme: "night",
          variables: {
            colorPrimary:         "#c8a84e",
            colorBackground:      "#221a1a",
            colorText:            "#E8DCC4",
            colorDanger:          "#c0524a",
            fontFamily:           "DM Sans, sans-serif",
            borderRadius:         "8px",
            colorTextPlaceholder: "#5a4f47",
            colorIcon:            "#c8a84e",
          },
          rules: {
            ".Input":       { border: "1px solid #3a2c2c", boxShadow: "none" },
            ".Input:focus": { border: "1px solid #c8a84e", boxShadow: "none" },
            ".Label":       { color: "#817361" },
          },
        },
      });

      paymentElement = elements.create("payment");
      paymentElement.mount("#payment-element");
      paymentElement.on("ready", () => { $("btn-pagar-cartao").disabled = false; });

    } else {
      $("stripe-element-wrapper").style.display = "none";
      $("div-nome-titular").style.display = "none";
      $("btn-pagar-cartao").disabled = false;
      setText("js-btn-texto", `Pagar ${fmtPreco(produto.preco)}`);
    }

  } catch (e) {
    mostrarErroInline(e.message || "Não foi possível inicializar o pagamento.");
  }
}

/* ── Preencher resumo lateral ─────────────────────────── */
function preencherResumo(p) {
  setText("js-produto-nome", p.nome);

  const tipo = p.tipo === "textura" ? "Textura PBR"
             : p.tipo === "modelo"  ? "Modelo 3D"
             : "HDRI";
  setText("js-produto-tipo", tipo);

  const specs = [p.resolucao, (p.formato || []).join("/")].filter(Boolean).join(" · ");
  setText("js-produto-spec", specs || "—");

  if (p.urlImagem) {
    const img = document.createElement("img");
    img.src = p.urlImagem;
    img.alt = p.nome;
    $("js-produto-img").innerHTML = "";
    $("js-produto-img").appendChild(img);
  }

  const preco = fmtPreco(p.preco);
  setText("js-subtotal", preco);
  setText("js-total", preco);
  document.title = `Checkout — ${p.nome} — JoinRender`;
  setText("js-btn-texto", `Pagar ${preco}`);
}

/* ── Botão pagar cartão ───────────────────────────────── */
$("btn-pagar-cartao").addEventListener("click", async () => {
  const btn  = $("btn-pagar-cartao");
  const span = $("js-btn-texto");
  btn.disabled = true;
  span.textContent = "Aguarde…";
  esconderErroInline();

  if (MODO_CARTAO === "checkout") {
    try {
      const token = await usuario.getIdToken();
      const res = await fetch(`${API_BASE}/criarcheckoutsessao`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ produtoId }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.mensagem || `Erro ${res.status}`);
      }
      const { url } = await res.json();
      location.href = url;

    } catch (e) {
      btn.disabled = false;
      span.textContent = `Pagar ${fmtPreco(produto.preco)}`;
      mostrarErroInline(e.message || "Não foi possível iniciar o pagamento. Tente novamente.");
    }

  } else {
    if (!elements) return;
    mostrarEstado("processando");

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${location.origin}/checkoutretorno.html?produto=${produtoId}`,
        payment_method_data: {
          billing_details: {
            name:  $("nome-titular").value.trim() || usuario?.displayName || "",
            email: usuario?.email || "",
          },
        },
      },
      redirect: "if_required",
    });

    if (error) {
      mostrarEstado("none");
      mostrarErroInline(traduzirErro(error));
      btn.disabled = false;
      span.textContent = `Pagar ${fmtPreco(produto.preco)}`;
      return;
    }
    await pagamentoAprovado();
  }
});

/* ── Pós-pagamento aprovado ───────────────────────────── */
async function pagamentoAprovado() {
  try {
    await setDoc(doc(db, "compras", `${usuario.uid}_${produtoId}`), {
      usuarioId:   usuario.uid,
      produtoId,
      preco:       produto.preco,
      nomeProduto: produto.nome,
      tipoProduto: produto.tipo,
      urlArquivo:  produto.urlArquivo || produto.urlModelo || "",
      criadoEm:    serverTimestamp(),
      status:      "aprovado",
    }, { merge: true });
  } catch (_) {}

  mostrarEstado("sucesso");
  setText("js-sucesso-msg", `"${produto.nome}" foi adicionado à sua biblioteca.`);

  const url = produto.urlArquivo || produto.urlModelo || null;
  if (url) {
    setTimeout(() => {
      const a = document.createElement("a");
      a.href = url;
      a.download = `${produto.nome || "asset"}.zip`;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }, 1200);
  }
}

/* ── Botões pós-estado ────────────────────────────────── */
$("btn-ir-biblioteca").addEventListener("click", () => { location.href = "login.html"; });

$("btn-tentar-novamente").addEventListener("click", () => {
  mostrarEstado("none");
  $("btn-pagar-cartao").disabled = false;
  setText("js-btn-texto", `Pagar ${fmtPreco(produto?.preco)}`);
});

/* ── Helpers de UI ────────────────────────────────────── */
function mostrarEstado(estado) {
  const paineis = document.querySelectorAll(".ck-painel");
  paineis.forEach(el => el.classList.toggle("oculto", estado !== "none" && estado !== ""));
  ["processando", "sucesso", "erro"].forEach(s => {
    $(`estado-${s}`)?.classList.toggle("visivel", s === estado);
  });
}

function mostrarErroInline(msg) {
  const el = $("js-erro-inline");
  el.textContent = msg;
  el.classList.add("visivel");
}

function esconderErroInline() {
  $("js-erro-inline").classList.remove("visivel");
}

function erroFatal(msg) {
  document.body.innerHTML = `
    <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:#1C1515;color:#E8DCC4;font-family:'DM Sans',sans-serif;padding:24px;text-align:center;">
      <div style="font-size:2.5rem;opacity:0.6;">⚠</div>
      <p style="color:#817361;max-width:320px;line-height:1.6;">${msg}</p>
      <a href="index.html" style="padding:12px 28px;background:#c8a84e;color:#1a1313;border-radius:8px;text-decoration:none;font-weight:700;">Voltar ao início</a>
    </div>`;
}

function traduzirErro(error) {
  const mapa = {
    card_declined:           "Cartão recusado.",
    insufficient_funds:      "Saldo insuficiente.",
    expired_card:            "Cartão expirado.",
    incorrect_cvc:           "CVC incorreto.",
    processing_error:        "Erro de processamento. Tente novamente.",
    incorrect_number:        "Número do cartão inválido.",
    authentication_required: "Autenticação necessária. Verifique o app do seu banco.",
  };
  return mapa[error.code] || error.message || "Erro desconhecido.";
}