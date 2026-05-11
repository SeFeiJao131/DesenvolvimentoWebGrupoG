import { app } from "./config.js";
import { buscarProdutoPorId } from "./db.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

// ⚠️ Substitua pela sua chave pública do Stripe
const STRIPE_PUBLIC_KEY = "pk_test_SUA_CHAVE_PUBLICA_AQUI";
const API_BASE = "/api";

const auth = getAuth(app);
const db   = getFirestore(app);

const params    = new URLSearchParams(window.location.search);
const produtoId = params.get("id");

let stripe, elements, paymentElement, produto, usuarioAtual;
let metodoPagamento = "cartao";

if (!produtoId) {
  mostrarErroFatal("Produto não encontrado.");
} else {
  inicializar();
}

async function inicializar() {
  try {
    produto = await buscarProdutoPorId(produtoId);
    if (!produto || !produto.ativo) { mostrarErroFatal("Produto não encontrado."); return; }
    if (produto.gratuito) { mostrarErroFatal("Este produto é gratuito. Baixe direto na página do produto."); return; }

    preencherResumo(produto);
    await carregarStripe();

    onAuthStateChanged(auth, async (usuario) => {
      if (!usuario) {
        window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
        return;
      }
      usuarioAtual = usuario;
      await configurarFormulario();
    });
  } catch (e) {
    mostrarErroFatal("Erro ao carregar checkout. Tente novamente.");
  }
}

async function carregarStripe() {
  return new Promise((resolve, reject) => {
    if (window.Stripe) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://js.stripe.com/v3/";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Falha ao carregar Stripe.js"));
    document.head.appendChild(s);
  });
}

async function configurarFormulario() {
  try {
    stripe = window.Stripe(STRIPE_PUBLIC_KEY);
    const idToken = await usuarioAtual.getIdToken();
    const resp = await fetch(`${API_BASE}/criar-payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
      body: JSON.stringify({ produtoId, usuarioId: usuarioAtual.uid }),
    });
    if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.mensagem || `Erro ${resp.status}`); }
    const { clientSecret } = await resp.json();

    elements = stripe.elements({
      clientSecret,
      appearance: {
        theme: "night",
        variables: {
          colorPrimary: "#c8a84e", colorBackground: "#221a1a",
          colorText: "#E8DCC4", colorDanger: "#c0524a",
          fontFamily: "DM Sans, sans-serif", borderRadius: "8px",
          colorTextPlaceholder: "#5a4f47", colorIcon: "#c8a84e",
        },
        rules: {
          ".Input": { border: "1px solid #3a2c2c", boxShadow: "none" },
          ".Input:focus": { border: "1px solid #c8a84e", boxShadow: "none" },
          ".Label": { color: "#817361" },
        },
      },
    });

    paymentElement = elements.create("payment");
    paymentElement.mount("#payment-element");
    paymentElement.on("ready", () => { document.getElementById("btn-pagar-cartao").disabled = false; });
  } catch (e) {
    mostrarErro(e.message || "Não foi possível inicializar o pagamento.");
  }
}

function preencherResumo(p) {
  setText("produto-nome-resumo", p.nome);
  const tipoLabel = p.tipo === "textura" ? "Textura PBR" : p.tipo === "modelo" ? "Modelo 3D" : "HDRI";
  setText("produto-tipo-resumo", tipoLabel);
  const specs = [p.resolucao, (p.formato || []).join("/")].filter(Boolean).join(" · ");
  setText("produto-spec-resumo", specs || "—");
  if (p.urlImagem) {
    const c = document.getElementById("produto-img-container");
    if (c) { const img = document.createElement("img"); img.src = p.urlImagem; img.alt = p.nome; c.innerHTML = ""; c.appendChild(img); }
  }
  const preco = `R$ ${Number(p.preco).toFixed(2)}`;
  setText("subtotal-valor", preco); setText("total-valor", preco);
  document.title = `Checkout — ${p.nome} — JoinRender`;
  setText("btn-pagar-texto", `Pagar R$ ${Number(p.preco).toFixed(2)}`);
}

function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

document.getElementById("tab-cartao")?.addEventListener("click", () => setMetodo("cartao"));
document.getElementById("tab-pix")?.addEventListener("click",    () => setMetodo("pix"));

function setMetodo(metodo) {
  metodoPagamento = metodo;
  ["cartao", "pix"].forEach(m => {
    document.getElementById(`tab-${m}`)?.classList.toggle("ativo", m === metodo);
    document.getElementById(`tab-${m}`)?.setAttribute("aria-selected", String(m === metodo));
    document.getElementById(`painel-${m}`)?.classList.toggle("oculto", m !== metodo);
  });
}

document.getElementById("btn-pagar-cartao")?.addEventListener("click", async () => {
  if (!stripe || !elements) return;
  const btn = document.getElementById("btn-pagar-cartao");
  const btnTexto = document.getElementById("btn-pagar-texto");
  btn.disabled = true;
  if (btnTexto) btnTexto.textContent = "Processando…";
  mostrarEstado("processando");

  const { error } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      return_url: `${window.location.origin}/checkout-retorno.html?produto=${produtoId}`,
      payment_method_data: {
        billing_details: { name: document.getElementById("nome-titular")?.value?.trim() || usuarioAtual?.displayName || "", email: usuarioAtual?.email || "" },
      },
    },
    redirect: "if_required",
  });

  if (error) {
    mostrarEstado("erro");
    setText("erro-mensagem", traduzirErroStripe(error));
    btn.disabled = false;
    if (btnTexto) btnTexto.textContent = `Pagar R$ ${Number(produto.preco).toFixed(2)}`;
    return;
  }
  await onPagamentoAprovado();
});

let pixTimer = null;

document.getElementById("btn-gerar-pix")?.addEventListener("click", async () => {
  const btn = document.getElementById("btn-gerar-pix");
  btn.disabled = true; btn.textContent = "Gerando PIX…";
  try {
    const idToken = await usuarioAtual.getIdToken();
    const resp = await fetch(`${API_BASE}/criar-pix`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
      body: JSON.stringify({ produtoId }),
    });
    if (!resp.ok) throw new Error(`Erro ${resp.status}`);
    const { qrCode, qrCodeBase64, copiaCola, expiresIn } = await resp.json();

    document.getElementById("pix-instrucoes-inicial")?.classList.add("oculto");
    document.getElementById("pix-qr-container")?.classList.remove("oculto");

    const qrBox = document.getElementById("pix-qr-box");
    if (qrBox) {
      if (qrCodeBase64) {
        const img = document.createElement("img");
        img.src = `data:image/png;base64,${qrCodeBase64}`; img.alt = "QR Code PIX";
        qrBox.innerHTML = ""; qrBox.appendChild(img);
      } else {
        await carregarQRLib();
        qrBox.innerHTML = "";
        if (window.QRCode) new window.QRCode(qrBox, { text: qrCode || copiaCola, width: 176, height: 176, colorDark: "#000000", colorLight: "#ffffff" });
      }
    }

    const inputCopia = document.getElementById("pix-codigo");
    if (inputCopia) inputCopia.value = copiaCola || qrCode || "";
    iniciarTimerPix(expiresIn || 1800);
    iniciarPollingPix();
  } catch (e) {
    btn.disabled = false; btn.textContent = "Gerar QR Code PIX";
    mostrarErro("Não foi possível gerar o PIX. Tente novamente.");
  }
});

document.getElementById("btn-copiar-pix")?.addEventListener("click", () => {
  const v = document.getElementById("pix-codigo")?.value;
  if (!v) return;
  navigator.clipboard.writeText(v).then(() => {
    const btn = document.getElementById("btn-copiar-pix");
    if (btn) { btn.innerHTML = '<i class="fi fi-rr-check"></i><span>Copiado!</span>'; setTimeout(() => { btn.innerHTML = '<i class="fi fi-rr-copy"></i><span>Copiar</span>'; }, 2000); }
  });
});

function iniciarTimerPix(segundos) {
  const el = document.getElementById("pix-timer");
  let r = segundos;
  pixTimer = setInterval(() => {
    r--;
    if (r <= 0) { clearInterval(pixTimer); if (el) el.textContent = "00:00"; return; }
    const m = String(Math.floor(r / 60)).padStart(2, "0");
    const s = String(r % 60).padStart(2, "0");
    if (el) el.textContent = `${m}:${s}`;
  }, 1000);
}

let pollingInterval = null;

async function iniciarPollingPix() {
  pollingInterval = setInterval(async () => {
    try {
      const idToken = await usuarioAtual.getIdToken();
      const resp = await fetch(`${API_BASE}/verificar-pix?produtoId=${produtoId}`, { headers: { "Authorization": `Bearer ${idToken}` } });
      if (!resp.ok) return;
      const { pago } = await resp.json();
      if (pago) { clearInterval(pollingInterval); clearInterval(pixTimer); await onPagamentoAprovado(); }
    } catch (_) {}
  }, 3000);
}

async function carregarQRLib() {
  if (window.QRCode) return;
  return new Promise(resolve => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    s.onload = resolve; document.head.appendChild(s);
  });
}

async function onPagamentoAprovado() {
  try {
    await setDoc(doc(db, "compras", `${usuarioAtual.uid}_${produtoId}`), {
      usuarioId: usuarioAtual.uid, produtoId,
      preco: produto.preco, nomeProduto: produto.nome, tipoProduto: produto.tipo,
      urlArquivo: produto.urlArquivo || produto.urlModelo || "",
      criadoEm: serverTimestamp(), status: "aprovado",
    }, { merge: true });
  } catch (_) {}

  mostrarEstado("sucesso");
  setText("sucesso-mensagem", `"${produto.nome}" foi adicionado à sua biblioteca.`);

  const url = produto.urlArquivo || produto.urlModelo || null;
  if (url) {
    setTimeout(() => {
      const a = document.createElement("a"); a.href = url; a.download = `${produto.nome || "asset"}.zip`; a.target = "_blank";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }, 1200);
  }
}

document.getElementById("btn-ir-biblioteca")?.addEventListener("click",     () => { window.location.href = "login.html"; });
document.getElementById("btn-tentar-novamente")?.addEventListener("click",  () => { mostrarEstado("nenhum"); setMetodo("cartao"); const btn = document.getElementById("btn-pagar-cartao"); if (btn) btn.disabled = false; setText("btn-pagar-texto", `Pagar R$ ${Number(produto?.preco).toFixed(2)}`); });

function mostrarEstado(estado) {
  ["processando", "sucesso", "erro"].forEach(s => document.getElementById(`estado-${s}`)?.classList.add("oculto"));
  document.querySelectorAll(".checkout-painel, .checkout-metodos").forEach(el => el.classList.toggle("oculto-checkout", estado !== "nenhum" && estado !== ""));
  if (["processando", "sucesso", "erro"].includes(estado)) document.getElementById(`estado-${estado}`)?.classList.remove("oculto");
}

function mostrarErro(msg) {
  let d = document.getElementById("checkout-erro-inline");
  if (!d) {
    d = document.createElement("div"); d.id = "checkout-erro-inline";
    d.style.cssText = "background:rgba(192,82,74,0.1);border:1px solid rgba(192,82,74,0.3);border-radius:8px;padding:10px 14px;color:#e0726b;font-size:0.82rem;margin-top:12px;";
    document.querySelector(".checkout-painel:not(.oculto)")?.appendChild(d);
  }
  d.textContent = msg;
}

function mostrarErroFatal(msg) {
  document.body.innerHTML = `<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:#1C1515;color:#E8DCC4;font-family:DM Sans,sans-serif;padding:24px;text-align:center;"><div style="font-size:2rem;">⚠</div><p style="color:#817361;max-width:320px;">${msg}</p><a href="index.html" style="padding:12px 24px;background:#c8a84e;color:#1a1313;border-radius:8px;text-decoration:none;font-weight:600;">Voltar ao início</a></div>`;
}

function traduzirErroStripe(error) {
  const c = { card_declined: "Cartão recusado.", insufficient_funds: "Saldo insuficiente.", expired_card: "Cartão expirado.", incorrect_cvc: "CVC incorreto.", processing_error: "Erro de processamento. Tente novamente.", incorrect_number: "Número do cartão inválido.", authentication_required: "Autenticação necessária. Verifique o app do seu banco." };
  return c[error.code] || error.message || "Erro desconhecido.";
}

const style = document.createElement("style");
style.textContent = ".oculto-checkout{display:none!important}.oculto{display:none!important}";
document.head.appendChild(style);