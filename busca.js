/* ═══════════════════════════════════════════════════════════════
   busca.js — Algolia Search para JoinRender
   ═══════════════════════════════════════════════════════════════ */

const ALGOLIA_APP_ID  = "AC7XL6FVL6";
const ALGOLIA_API_KEY = "d468aee7cc91ad6d128571bd8b782d2a";
const ALGOLIA_INDEX   = "produtos";

/* ─── Tags do estado inicial ─────────────────────────────────── */
const TAGS_INICIAIS = [
  { icon: "fi-rr-home",          label: "Casa",         tag: "casa",         desc: "Materiais e modelos para ambientes residenciais" },
  { icon: "fi-rr-tree",          label: "Natureza",     tag: "natureza",     desc: "Vegetação, terra, pedras e elementos orgânicos"   },
  { icon: "fi-rr-building",      label: "Arquitetura",  tag: "arquitetura",  desc: "Estruturas, fachadas e elementos construtivos"    },
  { icon: "fi-rr-couch",         label: "Mobiliário",   tag: "mobiliario",   desc: "Móveis e acessórios para interiores"              },
  { icon: "fi-rr-utensils",      label: "Cozinha",      tag: "cozinha",      desc: "Utensílios, eletrodomésticos e bancadas"          },
  { icon: "fi-rr-gem",           label: "Mármore",      tag: "marmore",      desc: "Pedras naturais polidas com veios procedurais"    },
  { icon: "fi-rr-sun",           label: "HDRI",         tag: "hdri",         desc: "Ambientes de iluminação para renders realistas"   },
  { icon: "fi-rr-cube",          label: "Modelos 3D",   tag: "modelo",       desc: "Assets prontos para usar em cenas 3D"            },
];

/* ─── Ícones por tipo ─────────────────────────────────────────── */
const iconeTipo = {
  textura: "fi-rr-picture",
  modelo:  "fi-rr-cube",
  hdri:    "fi-rr-sun",
};

/* ─── Badge Novo ─────────────────────────────────────────────── */
function ehNovo(ts) {
  if (!ts) return false;
  return Date.now() - ts * 1000 < 7 * 24 * 60 * 60 * 1000;
}

/* ─── Estado inicial com tags clicáveis ─────────────────────── */
function htmlInicial() {
  const linhas = TAGS_INICIAIS.map(t => `
    <div class="linha busca-tag-linha" data-tag="${t.tag}" style="cursor:pointer;">
      <a class="texto-painel"><i class="fi ${t.icon}"></i> ${t.label}</a>
      <span>${t.desc}</span>
      <span></span>
    </div>
  `).join("");
  return `<div class="conteudo-busca-inner">${linhas}</div>`;
}

/* ─── Card de resultado ──────────────────────────────────────── */
function criarResultado(hit) {
  const icone   = iconeTipo[hit.tipo] || "fi-rr-box-alt";
  const isNovo  = hit.novo || ehNovo(hit.criadoEm);
  const nomeHL  = hit._highlightResult?.nome?.value || hit.nome || "Sem nome";
  const tipoLabel = hit.tipo ? hit.tipo.charAt(0).toUpperCase() + hit.tipo.slice(1) : "";
  const badgeGratis = hit.gratis ? `<span class="busca-badge busca-badge-gratis">Grátis</span>` : "";
  const badgeNovo   = isNovo    ? `<span class="busca-badge busca-badge-novo">Novo</span>`    : "";

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

/* ─── Pesquisa no Algolia ─────────────────────────────────────── */
async function pesquisar(termo, conteudo, opts = {}) {
  const { tag } = opts;

  /* Monta filtro de tag se vier de clique */
  const filters = tag ? `tags:${tag} OR tipo:${tag} OR categorias:${tag}` : "";

  conteudo.innerHTML = `<p class="busca-carregando">Buscando…</p>`;

  try {
    const url = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`;
    const body = {
      query:               termo,
      hitsPerPage:         8,
      attributesToHighlight: ["nome"],
      highlightPreTag:     '<mark class="busca-hl">',
      highlightPostTag:    "</mark>",
    };
    if (filters) body.filters = filters;

    const res = await fetch(url, {
      method: "POST",
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

    /* Título do contexto */
    const tagInfo = TAGS_INICIAIS.find(t => t.tag === tag);
    const contexto = tagInfo
      ? `<span class="busca-tag-ativa"><i class="fi ${tagInfo.icon}"></i> ${tagInfo.label}</span>`
      : `"<strong>${termo}</strong>"`;

    if (!hits.length) {
      conteudo.innerHTML = `
        <p class="busca-secao-titulo">Nenhum resultado para ${contexto}</p>
        ${htmlInicial()}`;
      bindTags(conteudo);
      return;
    }

    conteudo.innerHTML = `
      <p class="busca-secao-titulo">${hits.length} resultado${hits.length !== 1 ? "s" : ""} para ${contexto}</p>
      <div class="busca-resultados">${hits.map(criarResultado).join("")}</div>`;

  } catch (err) {
    console.error("Algolia error:", err);
    conteudo.innerHTML = `<p class="busca-erro">Erro ao buscar. Verifique as credenciais do Algolia.</p>`;
  }
}

/* ─── Bind cliques nas tags ──────────────────────────────────── */
function bindTags(conteudo) {
  conteudo.querySelectorAll(".busca-tag-linha").forEach(linha => {
    linha.addEventListener("click", () => {
      const tag = linha.dataset.tag;
      pesquisar("", conteudo, { tag });
    });
  });
}

/* ─── Debounce ────────────────────────────────────────────────── */
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* ─── Inicialização ───────────────────────────────────────────── */
function iniciarBusca() {
  const overlay     = document.querySelector(".overlay-busca");
  const painel      = document.querySelector(".painel-busca");
  const conteudo    = document.querySelector(".conteudo-busca");
  const inputNav    = document.querySelector(".barra-pesquisa input");
  const inputPainel = document.querySelector(".busca-expandida input");

  if (!overlay || !painel || !conteudo || !inputNav || !inputPainel) return;

  const pesquisarDebounced = debounce((termo) => pesquisar(termo, conteudo), 280);

  function resetar() {
    conteudo.innerHTML = htmlInicial();
    bindTags(conteudo);
    inputNav.value    = "";
    inputPainel.value = "";
  }

  function abrirPainel() {
    overlay.classList.add("ativo");
    /* Renderiza estado inicial se ainda não tiver */
    if (!conteudo.querySelector(".conteudo-busca-inner") &&
        !conteudo.querySelector(".busca-resultados") &&
        !conteudo.querySelector(".busca-carregando")) {
      conteudo.innerHTML = htmlInicial();
      bindTags(conteudo);
    }
    setTimeout(() => inputPainel.focus(), 50);
    if (inputNav.value.trim()) {
      inputPainel.value = inputNav.value;
      pesquisar(inputNav.value, conteudo);
    }
  }

  inputNav.addEventListener("focus", abrirPainel);
  inputNav.addEventListener("click", abrirPainel);

  /* Enter → vai para página de resultados */
  inputNav.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && inputNav.value.trim()) {
      window.location.href = `ResultadoBusca.html?q=${encodeURIComponent(inputNav.value.trim())}`;
    }
  });

  inputNav.addEventListener("input", () => {
    inputPainel.value = inputNav.value;
    if (inputNav.value.trim()) {
      pesquisarDebounced(inputNav.value);
    } else {
      conteudo.innerHTML = htmlInicial();
      bindTags(conteudo);
    }
  });

  /* Enter no painel → vai para página de resultados */
  inputPainel.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && inputPainel.value.trim()) {
      window.location.href = `ResultadoBusca.html?q=${encodeURIComponent(inputPainel.value.trim())}`;
    }
  });

  inputPainel.addEventListener("input", () => {
    inputNav.value = inputPainel.value;
    if (inputPainel.value.trim()) {
      pesquisarDebounced(inputPainel.value);
    } else {
      conteudo.innerHTML = htmlInicial();
      bindTags(conteudo);
    }
  });

  /* Fecha ao clicar fora */
  overlay.addEventListener("click", (e) => {
    if (!painel.contains(e.target)) {
      overlay.classList.remove("ativo");
      resetar();
    }
  });

  /* Fecha com ESC */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("ativo")) {
      overlay.classList.remove("ativo");
      resetar();
    }
  });

  /* Estado inicial já renderizado */
  conteudo.innerHTML = htmlInicial();
  bindTags(conteudo);
}

document.addEventListener("DOMContentLoaded", iniciarBusca);