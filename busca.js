/* ═══════════════════════════════════════════════════════════════
   busca.js — Autocomplete com Algolia para JoinRender
   ═══════════════════════════════════════════════════════════════ */

const ALGOLIA_APP_ID  = "AC7XL6FVL6";
const ALGOLIA_API_KEY = "d468aee7cc91ad6d128571bd8b782d2a";
const ALGOLIA_INDEX   = "produtos";

/* ─── Tags do estado inicial ─────────────────────────────────── */
const TAGS_INICIAIS = [
  { icon: "fi-rr-home",     label: "Casa",        tag: "casa"        },
  { icon: "fi-rr-tree",     label: "Natureza",    tag: "natureza"    },
  { icon: "fi-rr-building", label: "Arquitetura", tag: "arquitetura" },
  { icon: "fi-rr-couch",    label: "Mobiliário",  tag: "mobiliario"  },
  { icon: "fi-rr-gem",      label: "Mármore",     tag: "marmore"     },
  { icon: "fi-rr-sun",      label: "HDRI",        tag: "hdri"        },
  { icon: "fi-rr-cube",     label: "Modelos 3D",  tag: "modelo"      },
  { icon: "fi-rr-utensils", label: "Cozinha",     tag: "cozinha"     },
];

/* ─── Estado inicial com tags clicáveis ─────────────────────── */
function htmlInicial() {
  const linhas = TAGS_INICIAIS.map(t => `
    <div class="linha busca-tag-linha" data-tag="${t.tag}" style="cursor:pointer;">
      <a class="texto-painel"><i class="fi ${t.icon}"></i> ${t.label}</a>
      <span></span><span></span>
    </div>`).join("");
  return `<div class="conteudo-busca-inner">${linhas}</div>`;
}

/* ─── Autocomplete: sugestões ao digitar ─────────────────────── */
function htmlAutoComplete(hits, termo) {
  if (!hits.length) {
    return `
      <div class="autocomplete-wrap">
        <p class="autocomplete-vazio">Nenhum resultado para "<strong>${termo}</strong>"</p>
      </div>`;
  }

  const itens = hits.map(hit => {
    const nome = hit._highlightResult?.nome?.value || hit.nome || "Sem nome";
    const tipo = hit.tipo ? hit.tipo.charAt(0).toUpperCase() + hit.tipo.slice(1) : "";
    return `
      <a href="produto.html?id=${hit.objectID}" class="autocomplete-item">
        <div class="autocomplete-img">
          ${hit.urlImagem
            ? `<img src="${hit.urlImagem}" alt="${hit.nome}">`
            : `<i class="fi fi-rr-box-alt"></i>`}
        </div>
        <div class="autocomplete-info">
          <span class="autocomplete-nome">${nome}</span>
          <span class="autocomplete-tipo">${tipo}</span>
        </div>
        <i class="fi fi-rr-angle-small-right autocomplete-seta"></i>
      </a>`;
  }).join("");

  return `
    <div class="autocomplete-wrap">
      <p class="autocomplete-titulo">Sugestões</p>
      ${itens}
      <a href="ResultadoBusca.html?q=${encodeURIComponent(termo)}" class="autocomplete-ver-todos">
        Ver todos os resultados para "<strong>${termo}</strong>" →
      </a>
    </div>`;
}

/* ─── Busca no Algolia (leve, só para autocomplete) ─────────── */
async function buscarSugestoes(termo, conteudo) {
  if (!termo.trim()) {
    conteudo.innerHTML = htmlInicial();
    bindTags(conteudo);
    return;
  }

  try {
    const url = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "X-Algolia-Application-Id": ALGOLIA_APP_ID,
        "X-Algolia-API-Key":        ALGOLIA_API_KEY,
        "Content-Type":             "application/json",
      },
      body: JSON.stringify({
        query:                 termo,
        hitsPerPage:           5,
        attributesToHighlight: ["nome"],
        highlightPreTag:       '<mark class="busca-hl">',
        highlightPostTag:      "</mark>",
        attributesToRetrieve:  ["nome", "tipo", "urlImagem", "objectID"],
      }),
    });

    if (!res.ok) throw new Error(`Algolia ${res.status}`);
    const dados = await res.json();
    conteudo.innerHTML = htmlAutoComplete(dados.hits || [], termo);

  } catch (err) {
    console.error("Algolia autocomplete erro:", err);
    conteudo.innerHTML = htmlInicial();
    bindTags(conteudo);
  }
}

/* ─── Bind cliques nas tags ──────────────────────────────────── */
function bindTags(conteudo) {
  conteudo.querySelectorAll(".busca-tag-linha").forEach(linha => {
    linha.addEventListener("click", () => {
      const tag = linha.dataset.tag;
      window.location.href = `ResultadoBusca.html?q=${encodeURIComponent(tag)}`;
    });
  });
}

/* ─── Debounce ────────────────────────────────────────────────── */
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* ─── Ir para página de resultados ──────────────────────────── */
function irParaResultados(termo) {
  if (termo.trim()) {
    window.location.href = `ResultadoBusca.html?q=${encodeURIComponent(termo.trim())}`;
  }
}

/* ─── Inicialização ───────────────────────────────────────────── */
function iniciarBusca() {
  const overlay     = document.querySelector(".overlay-busca");
  const painel      = document.querySelector(".painel-busca");
  const conteudo    = document.querySelector(".conteudo-busca");
  const inputNav    = document.querySelector(".barra-pesquisa input");
  const inputPainel = document.querySelector(".busca-expandida input");

  if (!overlay || !painel || !conteudo || !inputNav || !inputPainel) return;

  const buscarDebounced = debounce((termo) => buscarSugestoes(termo, conteudo), 250);

  function resetar() {
    conteudo.innerHTML = htmlInicial();
    bindTags(conteudo);
    inputNav.value    = "";
    inputPainel.value = "";
  }

  function abrirPainel() {
    overlay.classList.add("ativo");
    conteudo.innerHTML = htmlInicial();
    bindTags(conteudo);
    setTimeout(() => inputPainel.focus(), 50);
    if (inputNav.value.trim()) {
      inputPainel.value = inputNav.value;
      buscarSugestoes(inputNav.value, conteudo);
    }
  }

  /* Abre ao focar no input do header */
  inputNav.addEventListener("focus", abrirPainel);
  inputNav.addEventListener("click", abrirPainel);

  /* Enter → vai direto para ResultadoBusca */
  inputNav.addEventListener("keydown", (e) => {
    if (e.key === "Enter") irParaResultados(inputNav.value);
  });
  inputPainel.addEventListener("keydown", (e) => {
    if (e.key === "Enter") irParaResultados(inputPainel.value);
  });

  /* Input no header → sincroniza painel e busca sugestões */
  inputNav.addEventListener("input", () => {
    inputPainel.value = inputNav.value;
    buscarDebounced(inputNav.value);
  });

  /* Input no painel expandido */
  inputPainel.addEventListener("input", () => {
    inputNav.value = inputPainel.value;
    buscarDebounced(inputPainel.value);
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

  /* Estado inicial */
  conteudo.innerHTML = htmlInicial();
  bindTags(conteudo);
}

document.addEventListener("DOMContentLoaded", iniciarBusca);