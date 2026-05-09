// produto-lista.js
// Busca produtos via API REST própria em vez de Firestore direto

const API_BASE = "/api";

const meta = document.querySelector('meta[name="tipo-asset"]');
const tipo  = meta?.content || "textura";

const container = document.querySelector(".alinhar-cards, .alinhar-modelos, .alinhar-hdri");
if (!container) {
  console.warn("[produtos-lista] Container de cards não encontrado.");
} else {
  carregarLista();
}

/* ─── Skeleton loading ───────────────────────────────────────── */
function gerarSkeletons(quantidade = 12) {
  const classeCard   = tipo === "textura" ? "card-layout"         : tipo === "modelo" ? "card-modelo"         : "card-hdri";
  const classeImagem = tipo === "textura" ? "imagem-card-layout"  : tipo === "modelo" ? "imagem-card-modelo"  : "imagem-card-hdri";
  const classeInfo   = tipo === "textura" ? "info-card-layout"    : tipo === "modelo" ? "info-card-modelo"    : "info-card-hdri";

  return Array.from({ length: quantidade }, () => `
    <div class="${classeCard}" style="pointer-events:none;">
      <div class="${classeImagem}" style="background:linear-gradient(90deg,#2a1f1f 25%,#3a2a2a 50%,#2a1f1f 75%);background-size:200% 100%;animation:skeleton-shimmer 1.4s infinite;"></div>
      <div class="${classeInfo}" style="gap:8px;">
        <div style="height:12px;width:60%;background:#2a1f1f;border-radius:4px;animation:skeleton-shimmer 1.4s infinite;background-size:200% 100%;"></div>
        <div style="height:10px;width:40%;background:#2a1f1f;border-radius:4px;animation:skeleton-shimmer 1.4s infinite;background-size:200% 100%;"></div>
      </div>
    </div>`).join("");
}

/* Injeta animação CSS do shimmer uma única vez */
if (!document.getElementById("skeleton-style")) {
  const style = document.createElement("style");
  style.id = "skeleton-style";
  style.textContent = `@keyframes skeleton-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`;
  document.head.appendChild(style);
}

async function carregarLista() {
  container.innerHTML = gerarSkeletons(12);

  try {
    const url      = `${API_BASE}/produtos?tipo=${tipo}&limite=60`;
    const resposta = await fetch(url);

    if (!resposta.ok) throw new Error(`Erro ${resposta.status}`);

    const dados   = await resposta.json();
    const produtos = dados.produtos || [];

    if (!produtos.length) {
      container.innerHTML = `<p style="color:#6b5a5a; padding: 40px;">Nenhum asset encontrado.</p>`;
      return;
    }

    container.innerHTML = produtos.map(produto => gerarCard(produto, tipo)).join("");

  } catch (e) {
    container.innerHTML = `<p style="color:#c0392b; padding: 40px;">Erro ao carregar: ${e.message}</p>`;
  }
}

/* ─── Badge "Novo" — produtos criados nos últimos 7 dias ─────── */
function ehNovo(criadoEm) {
  if (!criadoEm) return false;
  const ts = typeof criadoEm === "number" ? criadoEm : criadoEm._seconds || 0;
  return Date.now() - ts * 1000 < 7 * 24 * 60 * 60 * 1000;
}

function gerarCard(produto, tipo) {
  const href       = `produto.html?id=${produto.id}`;
  const imagemSrc  = produto.urlImagem || "Imagens/ImagemTexturas.png";
  const nome       = produto.nome || "Sem nome";
  const desc       = produto.resolucao || (produto.gratuito ? "Grátis" : `R$ ${Number(produto.preco).toFixed(2)}`);

  const classeCard   = tipo === "textura" ? "card-layout"   : tipo === "modelo" ? "card-modelo"   : "card-hdri";
  const classeImagem = tipo === "textura" ? "imagem-card-layout" : tipo === "modelo" ? "imagem-card-modelo" : "imagem-card-hdri";
  const classeInfo   = tipo === "textura" ? "info-card-layout"   : tipo === "modelo" ? "info-card-modelo"   : "info-card-hdri";
  const classeTitulo = tipo === "textura" ? "titulo-card-layout"  : tipo === "modelo" ? "titulo-card-modelo"  : "titulo-card-hdri";
  const classeDesc   = tipo === "textura" ? "descricao-card-layout" : tipo === "modelo" ? "descricao-card-modelo" : "descricao-card-hdri";

  /* Badges */
  const isGratis = produto.gratuito === true || produto.gratis === true || Number(produto.preco) === 0;
  const isNovo   = produto.novo || ehNovo(produto.criadoEm);
  const badgeGratis = isGratis ? `<span class="badge-gratis-cat">Grátis</span>` : "";
  const badgeNovo   = isNovo   ? `<span class="badge-novo-cat">Novo</span>`     : "";

  return `
    <a href="${href}" class="${classeCard}" style="position:relative;">
      <div class="${classeImagem}">
        <img src="${imagemSrc}" alt="${nome}" loading="lazy" />
        ${badgeGratis}
        ${badgeNovo}
      </div>
      <div class="${classeInfo}">
        <h2 class="${classeTitulo}">${tipoLabel(tipo)}</h2>
        <p class="${classeDesc}">${nome}</p>
      </div>
    </a>
  `;
}

function tipoLabel(tipo) {
  return tipo === "textura" ? "Textura" : tipo === "modelo" ? "Modelo 3D" : "HDRI";
}