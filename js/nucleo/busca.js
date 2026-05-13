/* ═══════════════════════════════════════════════════════════════
   busca.js — Painel de busca + Autocomplete com Algolia
   ═══════════════════════════════════════════════════════════════ */

const ALGOLIA_APP_ID  = "AC7XL6FVL6";
const ALGOLIA_API_KEY = "d468aee7cc91ad6d128571bd8b782d2a";
const ALGOLIA_INDEX   = "produtos";

/* ─── Itens do painel inicial ────────────────────────────────── */
const PAINEL_ITENS = [
  {
    icon: "fi-rr-home",
    label: "Casa",
    desc: "Materiais e modelos para ambientes residenciais",
    q: "casa",
  },
  {
    icon: "fi-rr-tree",
    label: "Natureza",
    desc: "Vegetação, terra, pedras e elementos orgânicos",
    q: "natureza",
  },
  {
    icon: "fi-rr-building",
    label: "Cidade",
    desc: "Estruturas urbanas, fachadas e elementos construtivos",
    q: "cidade",
  },
  {
    icon: "fi-rr-sun",
    label: "HDRI",
    desc: "Ambientes de iluminação para renders realistas",
    q: "hdri",
  },
  {
    icon: "fi-rr-gem",
    label: "Mármore",
    desc: "Pedras naturais polidas com veios procedurais",
    q: "marmore",
  },
  {
    icon: "fi-rr-cube",
    label: "Modelos 3D",
    desc: "Assets prontos para usar em cenas 3D profissionais",
    q: "modelo",
  },
];

/* ─── Contagens por termo (buscadas do Algolia uma vez) ──────── */
const contagensCache = {};

async function buscarContagem(q) {
  if (contagensCache[q] !== undefined) return contagensCache[q];
  try {
    const res = await fetch(
      `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`,
      {
        method: "POST",
        headers: {
          "X-Algolia-Application-Id": ALGOLIA_APP_ID,
          "X-Algolia-API-Key":        ALGOLIA_API_KEY,
          "Content-Type":             "application/json",
        },
        body: JSON.stringify({ query: q, hitsPerPage: 0 }),
      }
    );
    const data = await res.json();
    contagensCache[q] = data.nbHits ?? 0;
    return contagensCache[q];
  } catch {
    return "";
  }
}

/* ─── HTML do estado inicial ─────────────────────────────────── */
function htmlInicial(contagens = {}) {
  const itens = PAINEL_ITENS.map(item => `
    <a class="busca-sugestao-item" href="ResultadoBusca.html?q=${encodeURIComponent(item.q)}">
      <span class="busca-sugestao-nome">
        <i class="fi ${item.icon}"></i>
        ${item.label}
      </span>
      <span class="busca-sugestao-desc">${item.desc}</span>
      <span class="busca-sugestao-count">${contagens[item.q] ?? ""}</span>
    </a>`).join("");

  return `<div class="busca-sugestoes-lista">${itens}</div>`;
}

/* ─── HTML autocomplete ao digitar ──────────────────────────── */
function htmlAutoComplete(hits, termo) {
  if (!hits.length) {
    return `
      <p class="busca-vazio">Nenhum resultado para "<strong>${termo}</strong>"</p>`;
  }

  const iconeTipo = { textura: "fi-rr-picture", modelo: "fi-rr-cube", hdri: "fi-rr-sun" };

  const itens = hits.map(hit => {
    // Sanitiza o highlight do Algolia para evitar XSS
    const nomeRaw = hit.nome || "";
    const hlValue = hit._highlightResult?.nome?.value || "";
    let nome = nomeRaw.replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));
    if (hlValue.includes("<em>")) {
      const termos = [...hlValue.matchAll(/<em>([^<]+)<\/em>/g)].map(m => m[1]);
      termos.forEach(t => {
        const r = new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
        nome = nome.replace(r, `<mark class="busca-hl">$1</mark>`);
      });
    }
    const icone = iconeTipo[hit.tipo] || "fi-rr-search";
    const tipo  = hit.tipo ? hit.tipo.charAt(0).toUpperCase() + hit.tipo.slice(1) : "";

    return `
      <a class="busca-sugestao-item" href="produto.html?id=${hit.objectID}">
        <span class="busca-sugestao-nome">
          <i class="fi ${icone}"></i>
          ${nome}
        </span>
        <span class="busca-sugestao-desc">${tipo}</span>
        <span class="busca-sugestao-count">↗</span>
      </a>`;
  }).join("");

  return `
    <div class="busca-sugestoes-lista">${itens}</div>
    <a class="busca-ver-todos" href="ResultadoBusca.html?q=${encodeURIComponent(termo)}">
      <span class="busca-ver-todos-texto">Ver todos os resultados para "${termo}"</span>
      <span class="busca-ver-todos-seta">→</span>
    </a>`;
}

/* ─── Debounce ────────────────────────────────────────────────── */
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* ─── Busca sugestões ────────────────────────────────────────── */
async function buscarSugestoes(termo, conteudo) {
  if (!termo.trim()) {
    conteudo.innerHTML = htmlInicial(contagensCache);
    return;
  }

  try {
    const res = await fetch(
      `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`,
      {
        method: "POST",
        headers: {
          "X-Algolia-Application-Id": ALGOLIA_APP_ID,
          "X-Algolia-API-Key":        ALGOLIA_API_KEY,
          "Content-Type":             "application/json",
        },
        body: JSON.stringify({
          query:                        termo,
          hitsPerPage:                  6,
          restrictSearchableAttributes: ["nome"],   // busca APENAS no campo nome
          attributesToRetrieve:         ["nome", "tipo", "objectID"],
          attributesToHighlight:        ["nome"],
          highlightPreTag:              '<mark class="busca-hl">',
          highlightPostTag:             "</mark>",
        }),
      }
    );
    const { hits } = await res.json();
    conteudo.innerHTML = htmlAutoComplete(hits, termo);
  } catch {
    conteudo.innerHTML = htmlInicial(contagensCache);
  }
}

/* ─── Ir para resultados ─────────────────────────────────────── */
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

  const buscarDebounced = debounce((t) => buscarSugestoes(t, conteudo), 230);

  /* Renderiza inicial e busca contagens em background */
  conteudo.innerHTML = htmlInicial();
  Promise.all(PAINEL_ITENS.map(i => buscarContagem(i.q))).then(() => {
    /* Só atualiza se o painel ainda estiver no estado inicial */
    if (!inputPainel.value.trim()) {
      conteudo.innerHTML = htmlInicial(contagensCache);
    }
  });

  function abrirPainel() {
    overlay.classList.add("ativo");
    if (!inputPainel.value.trim()) {
      conteudo.innerHTML = htmlInicial(contagensCache);
    }
    setTimeout(() => inputPainel.focus(), 40);
    if (inputNav.value.trim()) {
      inputPainel.value = inputNav.value;
      buscarSugestoes(inputNav.value, conteudo);
    }
  }

  function fecharPainel() {
    overlay.classList.remove("ativo");
    inputNav.value     = "";
    inputPainel.value  = "";
    conteudo.innerHTML = htmlInicial(contagensCache);
  }

  inputNav.addEventListener("focus", abrirPainel);
  inputNav.addEventListener("click", abrirPainel);

  inputNav.addEventListener("keydown", (e) => {
    if (e.key === "Enter") irParaResultados(inputNav.value);
  });

  inputNav.addEventListener("input", () => {
    inputPainel.value = inputNav.value;
    buscarDebounced(inputNav.value);
  });

  inputPainel.addEventListener("keydown", (e) => {
    if (e.key === "Enter") irParaResultados(inputPainel.value);
  });

  inputPainel.addEventListener("input", () => {
    inputNav.value = inputPainel.value;
    buscarDebounced(inputPainel.value);
  });

  overlay.addEventListener("click", (e) => {
    if (!painel.contains(e.target)) fecharPainel();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("ativo")) fecharPainel();
  });
}

document.addEventListener("DOMContentLoaded", iniciarBusca);