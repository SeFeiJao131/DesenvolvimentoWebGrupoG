/* ═══════════════════════════════════════════════════════════════
   produto-pagina.js — Página de detalhe do produto
   ═══════════════════════════════════════════════════════════════ */

import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyCG5CTMCU5Tm__Jx7AdIPFzqoyyjHgleU0",
  authDomain:        "joinrender-2ac79.firebaseapp.com",
  projectId:         "joinrender-2ac79",
  storageBucket:     "joinrender-2ac79.firebasestorage.app",
  messagingSenderId: "786464902095",
  appId:             "1:786464902095:web:c896cfb7fe22aed92ea0ba",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db  = getFirestore(app);

/* ─── Loader ─────────────────────────────────────────────────── */
function esconderLoader() {
  document.getElementById("viewer-loader")?.classList.add("oculto");
}

function erroViewer(msg) {
  const loader = document.getElementById("viewer-loader");
  if (!loader) return;
  loader.classList.remove("oculto");
  loader.innerHTML = `<span style="color:#c0392b;font-family:monospace;font-size:13px;text-align:center;padding:20px;">${msg}</span>`;
}

/* ─── Visualizador ───────────────────────────────────────────── */
function iniciarViewer(p) {
  const mv  = document.getElementById("model-viewer-el");
  const img = document.getElementById("viewer-imagem");

  const urlModelo = p.urlModelo || p.urlArquivo || "";
  const urlImagem = p.urlImagem || "";

  /* Caso 1: modelo 3D GLB/GLTF */
  if (p.tipo === "modelo" && urlModelo) {
    if (img) img.style.display = "none";

    mv.addEventListener("load", () => {
      esconderLoader();
      document.getElementById("viewer-controls")?.removeAttribute("style");
      document.getElementById("viewer-badges")?.removeAttribute("style");
    }, { once: true });

    mv.addEventListener("error", () => {
      erroViewer("Não foi possível carregar o modelo 3D.");
    }, { once: true });

    /* Setar src dispara o carregamento */
    mv.src = urlModelo;

    /* Timeout de segurança: 30s */
    setTimeout(() => {
      const loader = document.getElementById("viewer-loader");
      if (loader && !loader.classList.contains("oculto")) {
        erroViewer("Tempo esgotado ao carregar o modelo.");
      }
    }, 30000);

    return;
  }

  /* Caso 2: textura / HDRI — imagem estática */
  if (img && urlImagem) {
    mv.style.display = "none";
    img.style.display = "block";
    img.src = urlImagem;
    img.onload  = () => esconderLoader();
    img.onerror = () => erroViewer("Sem pré-visualização disponível.");
    return;
  }

  /* Caso 3: nada disponível */
  erroViewer("Nenhum arquivo de visualização disponível.");
}

/* ─── Preenche a página ──────────────────────────────────────── */
function preencherPagina(p) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? "—";
  };

  document.title = `${p.nome || "Produto"} — JoinRender`;

  set("nome-produto",    p.nome);
  set("descricao-produto", p.descricao);

  const isGratis = p.gratuito === true || p.gratis === true || Number(p.preco) === 0;
  set("preco-produto", isGratis ? "Grátis" : `R$ ${Number(p.preco || 0).toFixed(2)}`);

  set("spec-resolucao", p.resolucao);
  set("spec-formato",   Array.isArray(p.formato)  ? p.formato.join(", ")  : p.formato);
  set("spec-tamanho",   p.tamanhoMB ? `${p.tamanhoMB} MB` : null);
  set("spec-suporte",   Array.isArray(p.suporte)  ? p.suporte.join(", ")  : p.suporte);
  set("spec-render",    Array.isArray(p.render)   ? p.render.join(", ")   : p.render);

  set("badge-tipo",      p.tipo === "modelo" ? "Modelo 3D" : p.tipo === "hdri" ? "HDRI" : "Textura");
  set("badge-resolucao", p.resolucao);

  /* Breadcrumb */
  const bc = document.getElementById("breadcrumb");
  if (bc) {
    const labels = { modelo: "Modelos 3D", hdri: "HDRIs", textura: "Texturas" };
    const hrefs  = { modelo: "LayoutModelos.html", hdri: "LayoutHdri.html", textura: "LayoutTexturas.html" };
    bc.innerHTML = `
      <a href="index.html">Home</a><span>/</span>
      <a href="${hrefs[p.tipo] || "#"}">${labels[p.tipo] || "Produtos"}</a><span>/</span>
      <span>${p.nome || "Produto"}</span>`;
  }

  /* Botão de ação */
  const areaAcao = document.getElementById("area-acao");
  if (areaAcao) {
    const url = p.urlArquivo || p.urlModelo || "";
    if (isGratis && url) {
      areaAcao.innerHTML = `<a href="${url}" download target="_blank" rel="noopener" class="btn-download-produto">Baixar grátis</a>`;
    } else if (url) {
      areaAcao.innerHTML = `<button class="btn-download-produto" disabled>Comprar — R$ ${Number(p.preco).toFixed(2)}</button>`;
    }
  }

  /* Inicia o viewer por último */
  iniciarViewer(p);
}

/* ─── Carrega o produto do Firestore ─────────────────────────── */
async function carregarProduto() {
  const id = new URLSearchParams(window.location.search).get("id");

  if (!id) { erroViewer("ID do produto não informado."); return; }

  try {
    const snap = await getDoc(doc(db, "produtos", id));
    if (!snap.exists()) { erroViewer("Produto não encontrado."); return; }
    preencherPagina(snap.data());
  } catch (err) {
    console.error("Erro ao carregar produto:", err);
    erroViewer("Erro ao carregar produto.");
  }
}

/* ─── Controles do viewer ────────────────────────────────────── */
function configurarControles() {
  const mv = document.getElementById("model-viewer-el");
  if (!mv) return;

  document.getElementById("btn-reset-cam")?.addEventListener("click", () => {
    mv.cameraOrbit  = "0deg 75deg 105%";
    mv.cameraTarget = "0m 0m 0m";
  });

  document.getElementById("btn-autorotate")?.addEventListener("click", () => {
    mv.hasAttribute("auto-rotate")
      ? mv.removeAttribute("auto-rotate")
      : mv.setAttribute("auto-rotate", "");
  });

  const hdris = [
    null,
    "https://modelviewer.dev/shared-assets/environments/moon_1k.hdr",
    "https://modelviewer.dev/shared-assets/environments/neutral.hdr",
  ];
  let hi = 0;
  document.getElementById("btn-hdri")?.addEventListener("click", () => {
    hi = (hi + 1) % hdris.length;
    hdris[hi]
      ? mv.setAttribute("environment-image", hdris[hi])
      : mv.removeAttribute("environment-image");
  });
}

/* ─── Init ───────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  configurarControles();
  carregarProduto();
});