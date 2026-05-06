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

/* ─── Card (mesmo layout da página de categoria) ─────────────── */
function htmlCard(hit) {
  const tipoLabel = hit.tipo === "modelo" ? "Modelo 3D"
                  : hit.tipo === "hdri"   ? "HDRI"
                  : "Textura";

  const isNovo = hit.novo || ehNovo(hit.criadoEm);
  const nomeHL = hit._highlightResult?.nome?.value || hit.nome || "Sem nome";

  const badgeGratis = hit.gratis ? `<span class="badge-gratis-cat">Grátis</span>` : "";
  const badgeNovo   = isNovo     ? `<span class="badge-novo-cat">Novo</span>`     : "";

  return `
    <a href="produto.html?id=${hit.objectID}" class="card-categoria">
      ${hit.urlImagem
        ? `<img src="${hit.urlImagem}" alt="${hit.nome}" loading="lazy">`
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

/* ─── Pesquisa no Algolia ─────────────────────────────────────── */
async function pesquisarAlgolia(termo, filtro) {
  const url = `https://${RB_APP_ID}-dsn.algolia.net/1/indexes/${RB_INDEX}/query`;

  /* Monta filtro de tipo */
  let filters = "";
  if (filtro === "modelo")  filters = "tipo:modelo";
  if (filtro === "textura") filters = "tipo:textura";
  if (filtro === "gratis")  filters = "gratis:true";

  const body = {
    query:                 termo,
    hitsPerPage:           50,
    attributesToHighlight: ["nome"],
    highlightPreTag:       '<mark class="busca-hl">',
    highlightPostTag:      "</mark>",
  };
  if (filters) body.filters = filters;

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

  try {
    const hits = await pesquisarAlgolia(termo, filtro);

    /* Filtro "novo" é feito no cliente (não tem índice Algolia) */
    const filtrados = filtro === "novo"
      ? hits.filter(h => h.novo || ehNovo(h.criadoEm))
      : hits;

    const modelos  = filtrados.filter(h => h.tipo === "modelo");
    const texturas = filtrados.filter(h => h.tipo === "textura" || h.tipo === "hdri" || !h.tipo);

    totalEl.textContent = filtrados.length;

    renderizarSecao(gradeModelos,  countModelos,  btnModelos,  modelos);
    renderizarSecao(gradeTexturas, countTexturas, btnTexturas, texturas);

  } catch (err) {
    console.error("Algolia erro:", err);
    totalEl.textContent = "0";
    gradeModelos.innerHTML  = `<p class="busca-pg-erro">Erro ao buscar resultados.</p>`;
    gradeTexturas.innerHTML = "";
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