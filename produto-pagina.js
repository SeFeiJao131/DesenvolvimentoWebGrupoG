import { buscarProdutoPorId, registrarDownload, usuarioJaBaixou } from "./db.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyCG5CTMCU5Tm__Jx7AdIPFzqoyyjHgleU0",
  authDomain: "joinrender-2ac79.firebaseapp.com",
  projectId: "joinrender-2ac79",
  storageBucket: "joinrender-2ac79.firebasestorage.app",
  messagingSenderId: "786464902095",
  appId: "1:786464902095:web:c896cfb7fe22aed92ea0ba"
};

const app  = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

const params    = new URLSearchParams(window.location.search);
const produtoId = params.get("id");

if (!produtoId) {
  mostrarErro("Produto não encontrado.");
} else {
  carregarProduto();
}

async function carregarProduto() {
  try {
    const produto = await buscarProdutoPorId(produtoId);
    if (!produto || !produto.ativo) {
      mostrarErro("Produto não encontrado ou indisponível.");
      return;
    }
    preencherPagina(produto);
    iniciarViewer(produto);
    configurarAcao(produto);
  } catch (e) {
    mostrarErro("Erro ao carregar produto: " + e.message);
  }
}

// ── Preenche textos ────────────────────────────────────────────────────────────

function preencherPagina(produto) {
  document.title = `${produto.nome} — JoinRender`;

  setText("nome-produto",      produto.nome);
  setText("descricao-produto", produto.descricao || "Sem descrição disponível.");
  setText("preco-produto",     produto.gratuito ? "Gratuito" : `R$ ${Number(produto.preco).toFixed(2)}`);
  setText("spec-resolucao",    produto.resolucao || "—");
  setText("spec-formato",      (produto.formato  || []).join(", ") || "—");
  setText("spec-tamanho",      produto.tamanhoMB ? `${produto.tamanhoMB} MB` : "—");
  setText("spec-suporte",      (produto.suporte  || []).join(", ") || "—");
  setText("spec-render",       (produto.render   || []).join(", ") || "—");

  const tipoLabel = produto.tipo === "textura" ? "Texturas"
                  : produto.tipo === "modelo"  ? "Modelos 3D"
                  : "HDRIs";
  const tipoHref  = produto.tipo === "textura" ? "LayoutTexturas.html"
                  : produto.tipo === "modelo"  ? "LayoutModelos.html"
                  : "LayoutHdri.html";

  const breadcrumb = document.getElementById("breadcrumb");
  if (breadcrumb) {
    breadcrumb.innerHTML = `
      <a href="index.html">Home</a><span> / </span>
      <a href="${tipoHref}">${tipoLabel}</a><span> / </span>
      <span>${produto.nome}</span>
    `;
  }

  setText("badge-tipo",      tipoLabel.toUpperCase());
  if (produto.resolucao) setText("badge-resolucao", produto.resolucao);
}

function setText(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor;
}

// ── Viewer ─────────────────────────────────────────────────────────────────────

function iniciarViewer(produto) {
  const loader   = document.getElementById("viewer-loader");
  const badges   = document.getElementById("viewer-badges");
  const controls = document.getElementById("viewer-controls");
  const mv       = document.getElementById("model-viewer-el");

  const url3d = produto.urlModelo || null;

  if (url3d && mv) {
    iniciarModelViewer(url3d, produto, loader, controls, badges, mv);
  } else {
    if (mv) mv.remove();
    mostrarImagemViewer(produto, loader, badges);
    if (controls) controls.style.display = "none";
  }
}

function iniciarModelViewer(url3d, produto, loader, controls, badges, mv) {
  mv.src = url3d;
  if (produto.urlImagem) mv.poster = produto.urlImagem;
  mv.style.display = "block";

  // ── Ajuste automático de renderização por tipo de material ──────────────────
  const nome = (produto.nome || "").toLowerCase();
  const tags = (produto.tags || []).join(" ").toLowerCase();
  const tudo = nome + " " + tags;

  if (tudo.includes("vidro") || tudo.includes("glass") || tudo.includes("cristal") || tudo.includes("transparente")) {
    // Materiais transmissivos: exposição baixa, ambiente escuro, sem ACES
    mv.setAttribute("environment-image", "legacy");
    mv.setAttribute("exposure", "0.6");
    mv.setAttribute("tone-mapping", "commerce");
    mv.setAttribute("shadow-intensity", "0.3");
  } else if (tudo.includes("metal") || tudo.includes("aço") || tudo.includes("steel") || tudo.includes("aluminio") || tudo.includes("alumínio")) {
    // Metais: alto contraste, HDRI neutro
    mv.setAttribute("environment-image", "neutral");
    mv.setAttribute("exposure", "1.0");
    mv.setAttribute("tone-mapping", "aces");
    mv.setAttribute("shadow-intensity", "0.8");
  } else if (
    tudo.includes("madeira") || tudo.includes("tecido") ||
    tudo.includes("pedra")   || tudo.includes("concreto") ||
    tudo.includes("tijolo")  || tudo.includes("mármore") ||
    tudo.includes("marmore") || tudo.includes("superficie")
  ) {
    // Materiais difusos: configuração equilibrada
    mv.setAttribute("environment-image", "neutral");
    mv.setAttribute("exposure", "0.9");
    mv.setAttribute("tone-mapping", "commerce");
    mv.setAttribute("shadow-intensity", "0.6");
  } else {
    // Padrão genérico seguro para qualquer outro material
    mv.setAttribute("environment-image", "legacy");
    mv.setAttribute("exposure", "0.8");
    mv.setAttribute("tone-mapping", "commerce");
    mv.setAttribute("shadow-intensity", "0.5");
  }
  // ───────────────────────────────────────────────────────────────────────────

  mv.addEventListener("load", () => {
    if (loader)   loader.classList.add("oculto");
    if (badges)   badges.style.display   = "flex";
    if (controls) controls.style.display = "flex";
  });

  mv.addEventListener("error", () => {
    console.warn("[viewer] Falha ao carregar modelo, exibindo imagem.");
    mv.style.display = "none";
    mostrarImagemViewer(produto, loader, badges);
    if (controls) controls.style.display = "none";
  });

  mv.addEventListener("progress", (e) => {
    const pct = Math.round(e.detail.totalProgress * 100);
    const txt  = loader?.querySelector(".loader-texto");
    if (txt) txt.textContent = `CARREGANDO ${pct}%`;
  });

  // Botão resetar câmera
  const btnReset = document.getElementById("btn-reset-cam");
  if (btnReset) {
    btnReset.onclick = () => {
      mv.cameraOrbit  = "0deg 75deg 105%";
      mv.cameraTarget = "0m 0m 0m";
      mv.fieldOfView  = "auto";
    };
  }

  // Botão wireframe — model-viewer expõe materiais via getMaterial
  let wireframe = false;
  const btnWire = document.getElementById("btn-wireframe");
  if (btnWire) {
    btnWire.onclick = () => {
      wireframe = !wireframe;
      const count = mv.model?.materialCount ?? 0;
      for (let i = 0; i < count; i++) {
        const mat = mv.model?.getMaterialByIndex(i);
        if (mat) mat.setWireframe?.(wireframe);
      }
      btnWire.style.color = wireframe ? "var(--cor-dourado-vivo)" : "var(--cor-dourado-alt)";
    };
  }

  // Botão auto-rotação
  let autoRot = true;
  const btnAuto = document.getElementById("btn-autorotate");
  if (btnAuto) {
    btnAuto.style.color = "var(--cor-dourado-vivo)";
    btnAuto.onclick = () => {
      autoRot = !autoRot;
      autoRot ? mv.setAttribute("auto-rotate", "") : mv.removeAttribute("auto-rotate");
      btnAuto.style.color = autoRot ? "var(--cor-dourado-vivo)" : "var(--cor-dourado-alt)";
    };

    // Para auto-rotate quando o usuário arrastar
    mv.addEventListener("camera-change", (e) => {
      if (e.detail.source === "user-interaction" && autoRot) {
        autoRot = false;
        mv.removeAttribute("auto-rotate");
        btnAuto.style.color = "var(--cor-dourado-alt)";
      }
    });
  }
}

// ── Fallback imagem ────────────────────────────────────────────────────────────

function mostrarImagemViewer(produto, loader, badges) {
  const img = document.getElementById("viewer-imagem");
  if (!img) return;

  if (produto.urlImagem) {
    img.src = produto.urlImagem;
    img.alt = produto.nome || "Preview do asset";
    img.style.display = "block";
    img.onload  = () => {
      if (loader) loader.classList.add("oculto");
      if (badges) badges.style.display = "flex";
    };
    img.onerror = () => {
      img.style.display = "none";
      mostrarPlaceholder(img.parentElement, loader, badges);
    };
  } else {
    mostrarPlaceholder(img?.parentElement, loader, badges);
  }
}

function mostrarPlaceholder(container, loader, badges) {
  if (!container) return;
  const cvs = document.createElement("canvas");
  cvs.style.cssText = "width:100%;height:100%;display:block;";
  cvs.width  = 800;
  cvs.height = 675;
  const ctx  = cvs.getContext("2d");
  const grad = ctx.createRadialGradient(400, 338, 0, 400, 338, 500);
  grad.addColorStop(0, "#1e1515");
  grad.addColorStop(1, "#0a0808");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 675);
  ctx.strokeStyle = "rgba(200,169,78,0.06)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= 800; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 675); ctx.stroke(); }
  for (let y = 0; y <= 675; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke(); }
  ctx.fillStyle = "rgba(200,169,78,0.12)";
  ctx.font = "80px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("◈", 400, 338);
  container.appendChild(cvs);
  if (loader) loader.classList.add("oculto");
  if (badges) badges.style.display = "flex";
}

// ── Download ───────────────────────────────────────────────────────────────────

function configurarAcao(produto) {
  const areaAcao = document.getElementById("area-acao");
  if (!areaAcao) return;

  onAuthStateChanged(auth, async (usuario) => {

    if (!usuario) {
      areaAcao.innerHTML = `
        <button class="botao-download-pgProduto bloqueado" id="btn-acao">
          ${produto.gratuito ? "Login para baixar" : "Login para comprar"}
        </button>
      `;
      document.getElementById("btn-acao").onclick = () => window.location.href = "login.html";
      return;
    }

    if (!produto.gratuito) {
      areaAcao.innerHTML = `
        <button class="botao-download-pgProduto bloqueado" id="btn-acao">
          Comprar — R$ ${Number(produto.preco).toFixed(2)}
        </button>
        <p style="font-family:var(--font-mono);font-size:0.7rem;color:var(--cor-texto-escuro);text-align:center;margin-top:8px;">
          Sistema de pagamento em breve
        </p>
      `;
      document.getElementById("btn-acao").onclick = () => alert("Sistema de pagamento em breve. Aguarde!");
      return;
    }

    let jaBaixou = false;
    try { jaBaixou = await usuarioJaBaixou(produtoId); } catch (_) {}

    if (jaBaixou) {
      areaAcao.innerHTML = `
        <div class="badge-ja-baixado">✓ Já adicionado à sua biblioteca</div>
        <button class="botao-download-pgProduto sucesso" id="btn-acao" style="margin-top:6px;">
          Baixar novamente
        </button>
      `;
      document.getElementById("btn-acao").onclick = () => iniciarDownload(produto, true);
      return;
    }

    areaAcao.innerHTML = `
      <button class="botao-download-pgProduto" id="btn-acao">Download gratuito</button>
    `;
    document.getElementById("btn-acao").onclick = () => iniciarDownload(produto, false);
  });
}

async function iniciarDownload(produto, jaBaixou) {
  const btn = document.getElementById("btn-acao");
  if (!btn) return;

  btn.textContent = "Preparando…";
  btn.classList.add("carregando");

  try {
    if (!jaBaixou) await registrarDownload(produtoId);

    const urlArquivo = produto.urlArquivo || produto.urlModelo || null;

    if (urlArquivo) {
      const a = document.createElement("a");
      a.href     = urlArquivo;
      a.download = `${produto.nome || "asset"}.zip`;
      a.target   = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      btn.textContent = "✓ Download iniciado";
      btn.classList.remove("carregando");
      btn.classList.add("sucesso");
    } else {
      btn.textContent = "✓ Registrado na biblioteca";
      btn.classList.remove("carregando");
      btn.classList.add("sucesso");
      setTimeout(() => {
        btn.textContent = "Arquivo em breve";
        btn.classList.remove("sucesso");
      }, 3000);
    }
  } catch (e) {
    btn.textContent = "Erro — tente novamente";
    btn.classList.remove("carregando");
    console.error("[download]", e);
  }
}

// ── Erro ───────────────────────────────────────────────────────────────────────

function mostrarErro(msg) {
  setText("nome-produto",      "Produto não encontrado");
  setText("descricao-produto", msg);
  const loader = document.getElementById("viewer-loader");
  if (loader) loader.classList.add("oculto");
  const mv = document.getElementById("model-viewer-el");
  if (mv) mv.remove();
  const img = document.getElementById("viewer-imagem");
  if (img) img.style.display = "none";
}