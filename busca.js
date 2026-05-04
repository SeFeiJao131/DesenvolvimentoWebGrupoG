/* ═══════════════════════════════════════════════════════════════
   busca.js  —  Painel de busca JoinRender
   ═══════════════════════════════════════════════════════════════ */

/* ─── Sugestões pré-selecionadas (estado inicial do painel) ────── */
const SUGESTOES = [
  {
    icon:  "fi-rr-home",
    label: "Casa",
    tag:   "casa",
    desc:  "Materiais e modelos para ambientes residenciais",
    count: 24,
  },
  {
    icon:  "fi-rr-tree",
    label: "Natureza",
    tag:   "natureza",
    desc:  "Vegetação, terra, pedras e elementos orgânicos",
    count: 18,
  },
  {
    icon:  "fi-rr-box-alt",
    label: "Objetos",
    tag:   "objetos",
    desc:  "Assets de uso geral prontos para cena",
    count: 31,
  },
  {
    icon:  "fi-rr-gem",
    label: "Mármore",
    tag:   "marmore",
    desc:  "Pedras naturais polidas com veios procedurais",
    count: 12,
  },
];

/* ─── Ícones por tipo de asset ─────────────────────────────────── */
const ICONE_TIPO = {
  textura: "fi-rr-picture",
  modelo:  "fi-rr-cube",
  hdri:    "fi-rr-sun",
};

/* ─── Verifica se um produto é recente (últimos 7 dias) ─────────── */
function ehNovo(ts) {
  if (!ts) return false;
  return Date.now() - ts * 1000 < 7 * 24 * 60 * 60 * 1000;
}

/* ══════════════════════════════════════════════════════
   ESTADO INICIAL — 4 sugestões em tabela
   ══════════════════════════════════════════════════════ */
function htmlEstadoInicial() {
  const linhas = SUGESTOES.map(s => `
    <a class="busca-sugestao-item"
       href="ResultadoBusca.html?q=${encodeURIComponent(s.tag)}"
       data-tag="${s.tag}">
      <span class="busca-sugestao-nome">
        <i class="fi ${s.icon}"></i>
        ${s.label}
      </span>
      <span class="busca-sugestao-desc">${s.desc}</span>
      <span class="busca-sugestao-count">${s.count} produtos</span>
    </a>
  `).join("");

  return `
    <span class="busca-sugestoes-label">Sugestões</span>
    <div class="busca-sugestoes-lista">${linhas}</div>
  `;
}

/* ══════════════════════════════════════════════════════
   CARD DE RESULTADO (digitação)
   ══════════════════════════════════════════════════════ */
function htmlResultado(hit) {
  const icone      = ICONE_TIPO[hit.tipo] || "fi-rr-box-alt";
  const isNovo     = hit.novo || ehNovo(hit.criadoEm);
  const nomeHL     = hit._highlightResult?.nome?.value || hit.nome || "Sem nome";
  const tipoLabel  = hit.tipo
    ? hit.tipo.charAt(0).toUpperCase() + hit.tipo.slice(1)
    : "";
  const badgeGratis = hit.gratis
    ? `<span class="busca-badge busca-badge-gratis">Grátis</span>` : "";
  const badgeNovo   = isNovo
    ? `<span class="busca-badge busca-badge-novo">Novo</span>` : "";

  return `
    <a href="produto.html?id=${hit.objectID}" class="busca-resultado">
      <div class="busca-resultado-img">
        ${hit.urlImagem
          ? `<img src="${hit.urlImagem}" alt="${hit.nome}">`
          : `<i class="fi ${icone}"></i>`}
      </div>
      <div class="busca-resultado-info">
        <span class="busca-resultado-nome">${nomeHL}</span>
        <span class="busca-resultado-tipo">${tipoLabel}</span>
      </div>
      <div class="busca-resultado-badges">${badgeGratis}${badgeNovo}</div>
    </a>`;
}

/* ══════════════════════════════════════════════════════
   BUSCA NO ALGOLIA
   ══════════════════════════════════════════════════════ */
const ALGOLIA_APP_ID  = "AC7XL6FVL6";
const ALGOLIA_API_KEY = "d468aee7cc91ad6d128571bd8b782d2a";
const ALGOLIA_INDEX   = "produtos";

async function pesquisarAlgolia(termo, conteudo) {
  conteudo.innerHTML = `<p class="busca-carregando">Buscando…</p>`;

  try {
    const url  = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`;
    const body = {
      query:                  termo,
      hitsPerPage:            6,
      attributesToHighlight:  ["nome"],
      highlightPreTag:        '<mark class="busca-hl">',
      highlightPostTag:       "</mark>",
    };

    const res = await fetch(url, {
      method:  "POST",
      headers: {
        "X-Algolia-Application-Id": ALGOLIA_APP_ID,
        "X-Algolia-API-Key":        ALGOLIA_API_KEY,
        "Content-Type":             "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Algolia ${res.status}`);

    const dados = await res.json();
    const hits  = dados.hits || [];

    if (!hits.length) {
      /* Nenhum resultado — redireciona igualmente para aproveitar a
         página de resultados com a mensagem de "sem resultados"      */
      conteudo.innerHTML = `
        <p class="busca-vazio">
          Nenhum resultado para <strong>"${termo}"</strong>
        </p>
        ${htmlVerTodos(termo)}`;
      return;
    }

    conteudo.innerHTML = `
      <p class="busca-secao-titulo">
        ${hits.length} resultado${hits.length !== 1 ? "s" : ""}
        para <strong style="color:var(--cor-creme-alpha)">"${termo}"</strong>
      </p>
      <div class="busca-resultados">
        ${hits.map(htmlResultado).join("")}
      </div>
      ${htmlVerTodos(termo)}`;

  } catch (err) {
    console.error("Algolia error:", err);
    /* Falha na API — mostra link de redirecionamento mesmo assim */
    conteudo.innerHTML = `
      <p class="busca-erro">Erro ao buscar. Verifique as credenciais do Algolia.</p>
      ${htmlVerTodos(termo)}`;
  }
}

/* ─── Botão "Ver todos os resultados" ──────────────────────────── */
function htmlVerTodos(termo) {
  const href = `ResultadoBusca.html?q=${encodeURIComponent(termo)}`;
  return `
    <a class="busca-ver-todos" href="${href}">
      <span class="busca-ver-todos-texto">
        Ver todos os resultados para "${termo}"
      </span>
      <span class="busca-ver-todos-seta">→</span>
    </a>`;
}

/* ══════════════════════════════════════════════════════
   DEBOUNCE
   ══════════════════════════════════════════════════════ */
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/* ══════════════════════════════════════════════════════
   REDIRECIONAMENTO ao pressionar Enter
   ══════════════════════════════════════════════════════ */
function irParaResultados(termo) {
  if (!termo.trim()) return;
  window.location.href = `ResultadoBusca.html?q=${encodeURIComponent(termo.trim())}`;
}

/* ══════════════════════════════════════════════════════
   INICIALIZAÇÃO
   ══════════════════════════════════════════════════════ */
function iniciarBusca() {
  const overlay      = document.querySelector(".overlay-busca");
  const painel       = document.querySelector(".painel-busca");
  const conteudo     = document.querySelector(".conteudo-busca");
  const inputNav     = document.querySelector(".barra-pesquisa input");
  const inputPainel  = document.querySelector(".busca-expandida input");

  if (!overlay || !painel || !conteudo || !inputNav || !inputPainel) return;

  /* ── Renderiza estado inicial ── */
  function mostrarInicial() {
    conteudo.innerHTML = htmlEstadoInicial();
  }

  /* ── Abre painel ── */
  function abrirPainel() {
    overlay.classList.add("ativo");
    if (!conteudo.querySelector(".busca-sugestoes-lista") &&
        !conteudo.querySelector(".busca-resultados") &&
        !conteudo.querySelector(".busca-carregando")) {
      mostrarInicial();
    }
    setTimeout(() => inputPainel.focus(), 50);
    const valorAtual = inputNav.value.trim();
    if (valorAtual) {
      inputPainel.value = valorAtual;
      pesquisarAlgolia(valorAtual, conteudo);
    }
  }

  /* ── Fecha painel ── */
  function fecharPainel() {
    overlay.classList.remove("ativo");
    inputNav.value    = "";
    inputPainel.value = "";
    mostrarInicial();
  }

  /* ── Lógica de digitação com debounce ── */
  const pesquisarDebounced = debounce((termo) => {
    if (termo.trim()) {
      pesquisarAlgolia(termo, conteudo);
    } else {
      mostrarInicial();
    }
  }, 280);

  /* ── Sincroniza input do header → painel ── */
  inputNav.addEventListener("focus", abrirPainel);
  inputNav.addEventListener("click", abrirPainel);

  inputNav.addEventListener("input", () => {
    inputPainel.value = inputNav.value;
    pesquisarDebounced(inputNav.value);
  });

  inputNav.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      irParaResultados(inputNav.value);
    }
  });

  /* ── Sincroniza input do painel → header ── */
  inputPainel.addEventListener("input", () => {
    inputNav.value = inputPainel.value;
    pesquisarDebounced(inputPainel.value);
  });

  inputPainel.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      irParaResultados(inputPainel.value);
    }
  });

  /* ── Fecha ao clicar fora do painel ── */
  overlay.addEventListener("click", (e) => {
    if (!painel.contains(e.target)) {
      fecharPainel();
    }
  });

  /* ── Fecha com ESC ── */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("ativo")) {
      fecharPainel();
    }
  });

  /* ── Estado inicial já carregado ── */
  mostrarInicial();
}

document.addEventListener("DOMContentLoaded", iniciarBusca);