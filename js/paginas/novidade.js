/* ═══════════════════════════════════════════════════════════════
   novidade.js — Página de Novidades dinâmica
   Carrega produtos do Firestore ordenados por criadoEm desc.
   - Destaque principal: produto mais recente com destaque=true
   - Carrossel: os 8 mais recentes (qualquer produto ativo)
   - Grade: TODOS os produtos adicionados nos últimos 7 dias
             (seção independente — filtrável por tipo)
   ═══════════════════════════════════════════════════════════════ */

import { app } from "../nucleo/config.js";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

const db = getFirestore(app);

// ── Elementos do DOM ──────────────────────────────────────────────────────────

const elDestaque      = document.getElementById("nov-destaque");
const elTrilha        = document.getElementById("nov-carrossel-trilha");
const elGrade         = document.getElementById("nov-grade");
const elFiltros       = document.getElementById("nov-filtros");
const btnAnterior     = document.getElementById("nov-anterior");
const btnProximo      = document.getElementById("nov-proximo");

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatarData(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
}

function labelTipo(tipo) {
  return tipo === "modelo" ? "Modelo 3D" : tipo === "hdri" ? "HDRI" : "Textura";
}

function slugTipo(tipo) {
  return tipo === "textura"
    ? "LayoutTexturas.html"
    : tipo === "modelo"
    ? "LayoutModelos.html"
    : "LayoutHdri.html";
}

// ── Skeleton loaders ──────────────────────────────────────────────────────────

function skeletonDestaque() {
  elDestaque.innerHTML = `
    <div class="nov-destaque-imagem nov-skeleton" style="width:56%;min-height:220px;"></div>
    <div class="nov-destaque-info" style="gap:14px;">
      <div class="nov-skeleton" style="height:10px;width:30%;border-radius:4px;"></div>
      <div class="nov-skeleton" style="height:22px;width:70%;border-radius:4px;"></div>
      <div class="nov-skeleton" style="height:10px;width:90%;border-radius:4px;"></div>
      <div class="nov-skeleton" style="height:10px;width:60%;border-radius:4px;"></div>
      <div class="nov-skeleton" style="height:36px;width:120px;border-radius:20px;margin-top:4px;"></div>
    </div>`;
}

function skeletonCarrossel(n = 5) {
  elTrilha.innerHTML = Array.from({ length: n }, () => `
    <div class="nov-carrossel-cartao" style="pointer-events:none;">
      <div class="nov-cartao-imagem nov-skeleton"></div>
      <div class="nov-cartao-corpo" style="gap:6px;">
        <div class="nov-skeleton" style="height:9px;width:40%;border-radius:3px;"></div>
        <div class="nov-skeleton" style="height:12px;width:70%;border-radius:3px;"></div>
      </div>
    </div>`).join("");
}

function skeletonGrade(n = 6) {
  elGrade.innerHTML = Array.from({ length: n }, () => `
    <div class="nov-grade-cartao" style="pointer-events:none;">
      <div class="nov-grade-imagem nov-skeleton"></div>
      <div class="nov-grade-corpo" style="gap:6px;">
        <div class="nov-skeleton" style="height:9px;width:35%;border-radius:3px;"></div>
        <div class="nov-skeleton" style="height:13px;width:65%;border-radius:3px;"></div>
        <div class="nov-skeleton" style="height:9px;width:45%;border-radius:3px;margin-top:2px;"></div>
      </div>
    </div>`).join("");
}

// Injeta animação shimmer uma única vez
if (!document.getElementById("nov-skeleton-style")) {
  const s = document.createElement("style");
  s.id = "nov-skeleton-style";
  s.textContent = `
    .nov-skeleton {
      background: linear-gradient(90deg,#2a1f1f 25%,#3a2a2a 50%,#2a1f1f 75%);
      background-size: 200% 100%;
      animation: nov-shimmer 1.4s infinite;
    }
    @keyframes nov-shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }`;
  document.head.appendChild(s);
}

// ── Renderers ─────────────────────────────────────────────────────────────────

function renderDestaque(produto) {
  const data   = formatarData(produto.criadoEm);
  const label  = labelTipo(produto.tipo).toUpperCase();
  const href   = `produto.html?id=${produto.id}`;
  const imgSrc = produto.urlImagem || "";
  const imgTag = imgSrc
    ? `<img src="${imgSrc}" alt="${produto.nome}" loading="lazy">`
    : "";

  elDestaque.dataset.id  = produto.id;
  elDestaque.dataset.url = href;

  elDestaque.innerHTML = `
    <div class="nov-destaque-imagem">${imgTag}</div>
    <div class="nov-destaque-info">
      <p class="nov-destaque-etiqueta">NOVO · ${label}</p>
      <h2 class="nov-destaque-nome">${produto.nome}</h2>
      <p class="nov-destaque-descricao">${produto.descricao || ""}</p>
      <a class="nov-destaque-botao" href="${href}">Ver asset →</a>
      ${data ? `<p class="nov-destaque-data">Lançado em ${data}</p>` : ""}
    </div>`;
}

function renderCarrossel(produtos) {
  if (!produtos.length) {
    elTrilha.innerHTML = `<p style="color:var(--cor-texto-suave);font-size:13px;padding:8px 0;">Nenhum lançamento nos últimos 7 dias.</p>`;
    return;
  }

  elTrilha.innerHTML = produtos.map(p => {
    const imgTag = p.urlImagem
      ? `<img src="${p.urlImagem}" alt="${p.nome}" loading="lazy">`
      : "";
    return `
      <a class="nov-carrossel-cartao" href="produto.html?id=${p.id}" data-id="${p.id}">
        <div class="nov-cartao-imagem">${imgTag}</div>
        <div class="nov-cartao-corpo">
          <span class="nov-cartao-rotulo">${labelTipo(p.tipo)}</span>
          <span class="nov-cartao-nome">${p.nome}</span>
        </div>
      </a>`;
  }).join("");
}

function renderGrade(produtos) {
  if (!produtos.length) {
    elGrade.innerHTML = `
      <p style="color:var(--cor-texto-suave);font-size:13px;padding:8px 0;grid-column:1/-1;">
        Nenhum produto adicionado nos últimos 7 dias.
      </p>`;
    return;
  }

  elGrade.innerHTML = produtos.map(p => {
    const data   = formatarData(p.criadoEm);
    const imgTag = p.urlImagem
      ? `<img src="${p.urlImagem}" alt="${p.nome}" loading="lazy">`
      : "";
    return `
      <a class="nov-grade-cartao" href="produto.html?id=${p.id}" data-id="${p.id}" data-tipo="${p.tipo}">
        <div class="nov-grade-imagem">${imgTag}</div>
        <div class="nov-grade-corpo">
          <span class="nov-cartao-rotulo">${labelTipo(p.tipo)}</span>
          <span class="nov-cartao-nome">${p.nome}</span>
          ${data ? `<span class="nov-grade-data">${data}</span>` : ""}
        </div>
      </a>`;
  }).join("");
}

// ── Filtros da grade ──────────────────────────────────────────────────────────

function iniciarFiltros() {
  if (!elFiltros) return;

  elFiltros.addEventListener("click", (e) => {
    const btn = e.target.closest(".nov-filtro");
    if (!btn) return;

    document.querySelectorAll(".nov-filtro").forEach(b => b.classList.remove("ativo"));
    btn.classList.add("ativo");

    const filtro = btn.dataset.filtro;
    document.querySelectorAll(".nov-grade-cartao").forEach(card => {
      const visivel = filtro === "todos" || card.dataset.tipo === filtro;
      card.style.display = visivel ? "flex" : "none";
    });
  });
}

// ── Carrossel ─────────────────────────────────────────────────────────────────

function iniciarCarrossel() {
  if (!btnAnterior || !btnProximo || !elTrilha) return;

  let posicao = 0;

  function passo() {
    const cartao = elTrilha.querySelector(".nov-carrossel-cartao");
    return cartao ? cartao.offsetWidth + 12 : 200;
  }

  function mover() {
    const max = elTrilha.scrollWidth - elTrilha.parentElement.offsetWidth;
    posicao = Math.max(0, Math.min(posicao, max));
    elTrilha.style.transform = `translateX(-${posicao}px)`;
    btnAnterior.disabled = posicao <= 0;
    btnProximo.disabled  = posicao >= max;
  }

  btnProximo.addEventListener("click",   () => { posicao += passo() * 2; mover(); });
  btnAnterior.addEventListener("click",  () => { posicao -= passo() * 2; mover(); });

  // Reset ao redimensionar
  window.addEventListener("resize", () => { posicao = 0; mover(); }, { passive: true });

  mover();
}

// ── Busca no Firestore ────────────────────────────────────────────────────────

const SETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

function ehNovo(ts) {
  if (!ts) return false;
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return Date.now() - d.getTime() < SETE_DIAS_MS;
}

async function carregarNovidades() {
  // Exibe skeletons imediatamente
  skeletonDestaque();
  skeletonCarrossel();
  skeletonGrade();

  try {
    // ── Uma única query: todos os produtos ativos, do mais recente ao mais antigo
    // Sem limit fixo para garantir que todos os produtos de 7 dias sejam retornados.
    // O Firestore retorna até 100 por padrão — ajuste o limit se o catálogo crescer.
    const q = query(
      collection(db, "produtos"),
      where("ativo", "==", true),
      orderBy("criadoEm", "desc"),
      limit(100)
    );

    const snap = await getDocs(q);
    const todos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (!todos.length) {
      elDestaque.innerHTML = `<p style="color:var(--cor-texto-suave);padding:24px;font-size:13px;">Nenhuma novidade disponível no momento.</p>`;
      elTrilha.innerHTML = "";
      elGrade.innerHTML  = "";
      iniciarCarrossel();
      iniciarFiltros();
      return;
    }

    // ── Destaque: produto com destaque=true mais recente; fallback: o mais recente
    const produtoDestaque = todos.find(p => p.destaque) || todos[0];
    renderDestaque(produtoDestaque);

    // ── Carrossel: 6 aleatórios dos últimos 7 dias (embaralha a cada reload)
    const novos = todos.filter(p => ehNovo(p.criadoEm));
    const paraCarrossel = novos
      .slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);
    renderCarrossel(paraCarrossel);

    // ── Grade: TODOS os produtos dos últimos 7 dias (seção independente)
    const paraGrade = novos.slice(); // reutiliza o array já filtrado
    renderGrade(paraGrade);

  } catch (erro) {
    console.error("[novidade.js] Erro ao carregar produtos:", erro);
    elDestaque.innerHTML = `<p style="color:var(--cor-erro);padding:24px;font-size:13px;">Erro ao carregar novidades. Tente novamente.</p>`;
    elTrilha.innerHTML = "";
    elGrade.innerHTML  = "";
  }

  // Inicia carrossel e filtros após renderizar (independente de erro)
  iniciarCarrossel();
  iniciarFiltros();
}

// ── Inicialização ─────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", carregarNovidades);