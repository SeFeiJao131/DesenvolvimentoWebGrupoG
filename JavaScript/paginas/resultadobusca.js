/* ═══════════════════════════════════════════════════════════════
   resultadobusca.js — Página de resultados com Algolia
   ═══════════════════════════════════════════════════════════════ */

const RB_APP_ID  = "AC7XL6FVL6";
const RB_API_KEY = "d468aee7cc91ad6d128571bd8b782d2a";
const RB_INDEX   = "produtos";

/* ─── Badge Novo (menos de 7 dias) ──────────────────────────── */
function ehNovo(ts) {
  if (!ts) return false;
  return Date.now() - ts * 1000 < 7 * 24 * 60 * 60 * 1000;
}

/* ─── Sanitiza texto removendo HTML perigoso ─────────────────── */
function sanitizar(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

/* ─── Reconstrói highlight de forma segura ───────────────────── */
function highlightSeguro(hit) {
  const nomeRaw  = hit.nome || "Sem nome";
  const hlValue  = hit._highlightResult?.nome?.value || "";

  // O Algolia retorna tags <em> para highlight — extraímos os termos marcados
  // e reconstruímos o highlight sem risco de XSS
  if (!hlValue || !hlValue.includes("<em>")) return sanitizar(nomeRaw);

  const nomeSanitizado = sanitizar(nomeRaw);
  // Extrai os termos destacados pelo Algolia
  const termos = [...hlValue.matchAll(/<em>([^<]+)<\/em>/g)].map(m => m[1]);
  if (!termos.length) return nomeSanitizado;

  // Aplica highlight seguro substituindo os termos por <mark>
  let resultado = nomeSanitizado;
  termos.forEach(termo => {
    const regex = new RegExp("(" + termo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
    resultado = resultado.replace(regex, `<mark class="busca-hl">$1</mark>`);
  });
  return resultado;
}

/* ─── Card (mesmo layout da página de categoria) ─────────────── */
function htmlCard(hit) {
  const tipoLabel = hit.tipo === "modelo" ? "Modelo 3D"
                  : hit.tipo === "hdri"   ? "HDRI"
                  : "Textura";

  const isNovo    = hit.novo || ehNovo(hit.criadoEm);
  const isGratis  = hit.gratis || hit.gratuito || false;
  const badgeGratis = isGratis ? `<span class="badge-gratis-cat">Grátis</span>` : "";
  const badgeNovo   = isNovo   ? `<span class="badge-novo-cat">Novo</span>`     : "";
  const nomeHL    = highlightSeguro(hit);
  const urlImagem = sanitizar(hit.urlImagem || "");
  const nomeAlt   = sanitizar(hit.nome || "");
  const produtoId = sanitizar(hit.objectID || "");

  return `
    <a href="produto.html?id=${produtoId}" class="card-categoria">
      ${urlImagem
        ? `<img src="${urlImagem}" alt="${nomeAlt}" loading="lazy">`
        : `<div class="imagem-placeholder"></div>`}
      ${badgeGratis}
      ${badgeNovo}
      <div class="card-categoria-info">
        <span class="card-categoria-nome">${nomeHL}</span>
        <span class="card-categoria-tipo">${tipoLabel}</span>
      </div>
    </a>`;
}

/* ─── Renderiza seção ─────────────────────────────────────────── */
function renderizarSecao(gradeEl, contadorEl, btnEl, hits) {
  const secao = gradeEl.closest(".secao-resultados");
  if (!hits.length) {
    secao.style.display = "none";
    return;
  }
  secao.style.display = "";
  contadorEl.textContent = `${hits.length} resultado${hits.length !== 1 ? "s" : ""}`;
  gradeEl.innerHTML = hits.map(htmlCard).join("");
  gradeEl.classList.remove("expandida");
  btnEl.classList.remove("aberto");
  btnEl.querySelector(".btn-expandir-texto").textContent = "Ver todos";
}

/* ─── Pesquisa no Algolia (sem filtros server-side — tudo no cliente) ── */
async function pesquisarAlgolia(termo) {
  const url = `https://${RB_APP_ID}-dsn.algolia.net/1/indexes/${RB_INDEX}/query`;

  // Busca TUDO que corresponde ao termo — filtros são aplicados no cliente.
  // Isso evita a necessidade de configurar facets no painel do Algolia.
  const body = {
    query:                 termo,
    hitsPerPage:           1000, // pega todos os registros do índice
    attributesToHighlight: ["nome"],
    highlightPreTag:       '<mark class="busca-hl">',
    highlightPostTag:      "</mark>",
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-Algolia-Application-Id": RB_APP_ID,
      "X-Algolia-API-Key":        RB_API_KEY,
      "Content-Type":             "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Algolia ${res.status}`);
  return (await res.json()).hits || [];
}

/* ─── Aplica filtro no cliente ────────────────────────────────── */
function aplicarFiltro(hits, filtro) {
  switch (filtro) {
    case "modelo":  return hits.filter(h => h.tipo === "modelo");
    case "textura": return hits.filter(h => h.tipo === "textura" || h.tipo === "hdri");
    case "gratis":  return hits.filter(h => h.gratuito === true || h.gratis === true || h.preco === 0);
    case "novo":    return hits.filter(h => h.novo || ehNovo(h.criadoEm));
    default:        return hits; // "todos"
  }
}

/* ─── Renderiza a página completa ─────────────────────────────── */
async function renderizarPagina(termo, filtro) {
  const totalEl       = document.getElementById("total-resultados");
  const gradeModelos  = document.getElementById("grade-modelos");
  const gradeTexturas = document.getElementById("grade-texturas");
  const countModelos  = document.getElementById("count-modelos");
  const countTexturas = document.getElementById("count-texturas");
  const btnModelos    = document.getElementById("btn-modelos");
  const btnTexturas   = document.getElementById("btn-texturas");

  /* Loading */
  totalEl.textContent = "…";
  gradeModelos.innerHTML  = `<p class="busca-pg-loading">Buscando…</p>`;
  gradeTexturas.innerHTML = `<p class="busca-pg-loading">Buscando…</p>`;

  // Garante que as seções fiquem visíveis durante o carregamento
  document.getElementById("secao-modelos").style.display  = "";
  document.getElementById("secao-texturas").style.display = "";

  try {
    const hits     = await pesquisarAlgolia(termo);
    const filtrados = aplicarFiltro(hits, filtro);

    const modelos  = filtrados.filter(h => h.tipo === "modelo");
    const texturas = filtrados.filter(h => h.tipo === "textura" || h.tipo === "hdri");

    totalEl.textContent = filtrados.length;

    renderizarSecao(gradeModelos,  countModelos,  btnModelos,  modelos);
    renderizarSecao(gradeTexturas, countTexturas, btnTexturas, texturas);

    // Mensagem quando nenhum resultado em nenhuma seção
    if (!modelos.length && !texturas.length) {
      gradeModelos.innerHTML = `<p class="busca-pg-vazio">Nenhum resultado para este filtro.</p>`;
      document.getElementById("secao-modelos").style.display = "";
    }

  } catch (err) {
    console.error("Algolia erro:", err);
    totalEl.textContent = "0";
    gradeModelos.innerHTML  = `<p class="busca-pg-erro">Erro ao buscar resultados.</p>`;
    gradeTexturas.innerHTML = "";
    document.getElementById("secao-modelos").style.display  = "";
    document.getElementById("secao-texturas").style.display = "none";
  }
}

/* ─── Expandir / recolher seção ──────────────────────────────── */
function configurarExpandir(btnId, gradeId) {
  const btn   = document.getElementById(btnId);
  const grade = document.getElementById(gradeId);
  if (!btn || !grade) return;
  btn.addEventListener("click", () => {
    const aberto = btn.classList.toggle("aberto");
    grade.classList.toggle("expandida", aberto);
    btn.querySelector(".btn-expandir-texto").textContent = aberto ? "Recolher" : "Ver todos";
  });
}

/* ─── Inicialização ───────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const termo  = params.get("q") || "";

  /* Preenche cabeçalho */
  const termoCapit = termo ? termo.charAt(0).toUpperCase() + termo.slice(1) : "";
  document.getElementById("titulo-termo").textContent     = termo ? `"${termoCapit}"` : "";
  document.getElementById("breadcrumb-termo").textContent = termo || "todos";
  if (termo) document.title = `Busca: ${termo} — JoinRender`;

  /* Sincroniza input do header */
  const inputHeader = document.getElementById("input-busca-header");
  if (inputHeader && termo) inputHeader.value = termo;

  /* Filtro ativo */
  let filtroAtivo = "todos";
  renderizarPagina(termo, filtroAtivo);

  /* Filtros rápidos */
  document.querySelectorAll(".filtro-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filtro-btn").forEach(b => b.classList.remove("ativo"));
      btn.classList.add("ativo");
      filtroAtivo = btn.dataset.filtro;
      renderizarPagina(termo, filtroAtivo);
    });
  });

  /* Expandir / recolher */
  configurarExpandir("btn-modelos",  "grade-modelos");
  configurarExpandir("btn-texturas", "grade-texturas");
});