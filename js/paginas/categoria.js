import { app } from "../nucleo/config.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

/* Firebase */
const db = getFirestore(app);

/* ── Descrições por categoria ── */
const descricoesCat = {
  /* Texturas */
  metais:     "Metais polidos, enferrujados e escovados com reflexos físicos precisos e mapeamento PBR completo.",
  madeiras:   "Madeiras procedurais com grãos realistas, nós e variações de cor para qualquer ambiente.",
  pedras:     "Pedras naturais com superfícies irregulares, fissuras e mapeamento de deslocamento detalhado.",
  concreto:   "Concretos lisos e texturizados com variações de imperfeições, manchas e fissuras reais.",
  outros:     "Texturas variadas que não se encaixam nas categorias principais, incluindo materiais mistos, experimentais e superfícies únicas.",
  vidros:     "Vidros com transparência, reflexos e efeitos de sujeira, arranhões e condensação.",
  marmore:    "Mármores procedurais de alta fidelidade com veios naturais e mapeamento PBR completo.",
  organicos:  "Materiais orgânicos como terra, musgo, folhas e solo com detalhes procedurais realistas.",
  superficie: "Superfícies mistas e genéricas com variações de desgaste, sujeira e rugosidade.",
  tijolo:     "Tijolos artesanais e industriais com detalhamento de juntas, argamassa e desgaste.",

  /* HDRIs */
  ensolarado:  "Ambientes HDRI com iluminação solar intensa, céu limpo e sombras nítidas para cenas diurnas.",
  nascerdosol: "HDRIs de nascer do sol com tons quentes de laranja e rosa para iluminação atmosférica suave.",
  noite:       "Ambientes noturnos estrelados e urbanos com luzes artificiais e tons frios de azul profundo.",
  nublado:     "Céus encobertos com iluminação difusa e uniforme, ideais para renders sem sombras duras.",
  pordosol:    "HDRIs de pôr do sol com gradientes dourados e violetas para cenas de fim de tarde.",

  /* Modelos */
  banheiro:    "Modelos 3D de banheiros com acessórios, louças e acabamentos de alta fidelidade.",
  comida:      "Modelos de alimentos e bebidas com materiais realistas, prontos para cenas de produto.",
  cozinha:     "Modelos de utensílios, eletrodomésticos e mobília de cozinha com detalhes construtivos.",
  eletronicos: "Eletrônicos e gadgets modelados com precisão técnica e materiais PBR calibrados.",
  moveis:      "Mobiliário residencial e corporativo com geometria limpa e texturas prontas para uso.",
  natureza:    "Plantas, árvores, rochas e elementos naturais otimizados para cenas externas e interiores.",
  objetos:     "Objetos de uso cotidiano com geometria detalhada e materiais calibrados para render.",
  portas:      "Portas, janelas e esquadrias arquitetônicas com mecanismos e acabamentos variados.",
};

/* ── Rótulos de tipo ── */
const labelTipo = {
  textura: "Texturas",
  modelo:  "Modelos",
  hdri:    "HDRIs",
};

const hrefTipo = {
  textura: "../paginas/LayoutTexturas.html",
  modelo:  "../paginas/LayoutModelos.html",
  hdri:    "../paginas/LayoutHdri.html",
};

/* ── Breadcrumb ── */
function preencherBreadcrumb(tipo, cat) {
  const container = document.querySelector(".caminho-categoria");
  if (!container) return;

  const partes = [{ label: "Home", href: "../index.html" }];

  if (tipo) {
    const tipoLower = tipo.toLowerCase();
    partes.push({ label: labelTipo[tipoLower] || tipo, href: hrefTipo[tipoLower] || "#" });
  }
  if (cat) {
    const label = cat.charAt(0).toUpperCase() + cat.slice(1);
    partes.push({ label });
  }

  container.innerHTML = partes
    .map((p, i) =>
      i < partes.length - 1
        ? `<a href="${p.href || "#"}">${p.label}</a><span> / </span>`
        : `<span>${p.label}</span>`
    )
    .join("");
}

/* ── Descrição ── */
function preencherDescricao(cat) {
  const el = document.querySelector(".categoria-descricao");
  if (!el || !cat) return;
  el.textContent = descricoesCat[cat.toLowerCase()] || "";
}

/* ── Verifica se o produto é novo (menos de 7 dias) ── */
function ehNovo(timestamp) {
  if (!timestamp) return false;
  const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seteDias = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - data.getTime() < seteDias;
}

function formatarData(timestamp) {
  if (!timestamp) return "";
  const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function criarCard(doc) {
  const p = doc.data();
  const id = doc.id;

  const imagemTag = p.urlImagem
    ? `<img src="${p.urlImagem}" alt="${p.nome}">`
    : `<div style="width:100%;height:100%;background:#2a1f1f;"></div>`;

  const badgeGratis = (p.gratuito || p.gratis || p.preco === 0) ? `<span class="badge-gratis-cat">Grátis</span>` : "";
  const isNovo = p.novo || ehNovo(p.criadoEm);
  const badgeNovo = isNovo ? `<span class="badge-novo-cat">Novo</span>` : "";

  return `
    <a href="produto.html?id=${id}" class="card-categoria">
      ${imagemTag}
      ${badgeGratis}
      ${badgeNovo}
      <div class="card-categoria-info">
        <span class="card-categoria-nome">${p.nome || "Sem nome"}</span>
        <span class="card-categoria-tipo">${p.tipo || ""}</span>
        <div class="card-categoria-meta">
          <span class="card-categoria-resolucao">${p.resolucao || ""}</span>
          <span class="card-categoria-data">${formatarData(p.criadoEm)}</span>
        </div>
      </div>
    </a>
  `;
}

const POR_PAGINA = 12;

async function carregarProdutos() {
  const grade    = document.getElementById("grade-produtos");
  const contagem = document.getElementById("contagem-produtos");
  if (!grade || !contagem) return;

  const params = new URLSearchParams(window.location.search);
  const tipo = params.get("tipo");
  const cat  = params.get("cat");

  preencherBreadcrumb(tipo, cat);
  preencherDescricao(cat);

  const titulo = document.querySelector(".categoria-titulo");
  if (titulo && cat) {
    titulo.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
  }

  try {
    let q;
    if (tipo && cat) {
      q = query(collection(db, "produtos"), where("tipo", "==", tipo), where("categorias", "array-contains", cat));
    } else if (cat) {
      q = query(collection(db, "produtos"), where("categorias", "array-contains", cat));
    } else if (tipo) {
      q = query(collection(db, "produtos"), where("tipo", "==", tipo));
    } else {
      q = query(collection(db, "produtos"));
    }

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      contagem.textContent = "Nenhum produto encontrado";
      grade.innerHTML = "<p style='color:#aaa;padding:2rem;'>Nenhum produto nesta categoria ainda.</p>";
      return;
    }

    const todosDocs = snapshot.docs.sort((a, b) => {
      const dataA = a.data().criadoEm?.toDate?.() ?? new Date(0);
      const dataB = b.data().criadoEm?.toDate?.() ?? new Date(0);
      return dataB - dataA;
    });

    let filtroAtual = "todos";
    let paginaAtual = 1;
    let docsVisiveis = [];

    function aplicarFiltro(filtro) {
      if (filtro === "gratis") {
        return todosDocs.filter(d => {
          const p = d.data();
          return p.gratuito === true || p.gratis === true || p.preco === 0;
        });
      } else if (filtro === "novo") {
        return todosDocs.filter(d => {
          const p = d.data();
          return p.novo || ehNovo(p.criadoEm);
        });
      }
      return todosDocs;
    }

    function atualizarBotaoCarregarMais(total) {
      let btn = document.getElementById("btn-carregar-mais");
      const visiveis = paginaAtual * POR_PAGINA;

      if (visiveis >= total) {
        if (btn) btn.remove();
        return;
      }

      if (!btn) {
        btn = document.createElement("button");
        btn.id = "btn-carregar-mais";
        btn.className = "filtro-btn";
        btn.style.cssText = "display:block;margin:32px auto 0;padding:10px 32px;";
        grade.parentElement.insertBefore(btn, grade.nextSibling);
        btn.addEventListener("click", () => {
          paginaAtual++;
          renderizarPagina();
        });
      }

      const restantes = total - visiveis;
      btn.textContent = `Carregar mais (${restantes} restantes)`;
    }

    function renderizarPagina() {
      const limite = paginaAtual * POR_PAGINA;
      const slice  = docsVisiveis.slice(0, limite);

      grade.innerHTML = slice.length
        ? slice.map(criarCard).join("")
        : "<p style='color:#aaa;padding:2rem;'>Nenhum produto encontrado para este filtro.</p>";

      atualizarBotaoCarregarMais(docsVisiveis.length);
    }

    function renderizarComFiltro(filtro) {
      filtroAtual  = filtro;
      paginaAtual  = 1;
      docsVisiveis = aplicarFiltro(filtro);

      const total = docsVisiveis.length;
      contagem.textContent = `${total} produto${total !== 1 ? "s" : ""}`;
      renderizarPagina();
    }

    renderizarComFiltro("todos");

    document.querySelectorAll(".filtro-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.id === "btn-carregar-mais") return;
        document.querySelectorAll(".filtro-btn").forEach(b => b.classList.remove("ativo"));
        btn.classList.add("ativo");
        renderizarComFiltro(btn.dataset.filtro);
      });
    });

  } catch (erro) {
    console.error("Erro ao carregar produtos:", erro);
    grade.innerHTML = "<p style='color:#f66;padding:2rem;'>Erro ao carregar produtos. Verifique o console.</p>";
  }
}

carregarProdutos();