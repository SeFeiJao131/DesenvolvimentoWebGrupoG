/* ═══════════════════════════════════════════════════════════════
   resultadosbusca.js
   Lógica da página de resultados de pesquisa — JoinRender
   ═══════════════════════════════════════════════════════════════ */

/* ─── Dados estáticos de exemplo (substituir por Algolia depois) ─ */
const PRODUTOS_MOCK = [
  /* Modelos 3D */
  {
    id: "m001", tipo: "modelo", nome: "Móveis de Madeira",
    imagem: "Imagens/Moveis.jpg",
    href: "produto.html?id=m001",
    gratis: true,  novo: false,
    tags: ["madeira", "moveis", "mobiliario", "casa"],
  },
  {
    id: "m002", tipo: "modelo", nome: "Cozinha Rústica",
    imagem: "Imagens/Cozinha.jpg",
    href: "produto.html?id=m002",
    gratis: false, novo: true,
    tags: ["cozinha", "madeira", "casa"],
  },
  {
    id: "m003", tipo: "modelo", nome: "Banheiro Madeirado",
    imagem: "Imagens/Banheiro.jpg",
    href: "produto.html?id=m003",
    gratis: false, novo: false,
    tags: ["banheiro", "madeira", "casa"],
  },
  {
    id: "m004", tipo: "modelo", nome: "Porta de Madeira",
    imagem: "Imagens/Porta.jpg",
    href: "produto.html?id=m004",
    gratis: true,  novo: false,
    tags: ["porta", "madeira", "arquitetura"],
  },
  {
    id: "m005", tipo: "modelo", nome: "Objetos em Madeira",
    imagem: "Imagens/Objetos.jpg",
    href: "produto.html?id=m005",
    gratis: false, novo: false,
    tags: ["objetos", "madeira", "casa"],
  },
  {
    id: "m006", tipo: "modelo", nome: "Tronco Detalhado",
    imagem: "Imagens/Natureza.jpg",
    href: "produto.html?id=m006",
    gratis: false, novo: true,
    tags: ["natureza", "madeira", "arvore"],
  },
  {
    id: "m007", tipo: "modelo", nome: "Mesa de Jantar",
    imagem: "Imagens/Comida.jpg",
    href: "produto.html?id=m007",
    gratis: false, novo: false,
    tags: ["mesa", "madeira", "mobiliario", "casa"],
  },
  {
    id: "m008", tipo: "modelo", nome: "Eletrônicos de Escritório",
    imagem: "Imagens/Eletronicos.jpg",
    href: "produto.html?id=m008",
    gratis: true,  novo: false,
    tags: ["eletronicos", "escritorio"],
  },
  {
    id: "m009", tipo: "modelo", nome: "Cena de Natureza",
    imagem: "Imagens/Natureza.jpg",
    href: "produto.html?id=m009",
    gratis: false, novo: false,
    tags: ["natureza", "arvore", "exterior"],
  },

  /* Texturas */
  {
    id: "t001", tipo: "textura", nome: "Madeira Natural PBR",
    imagem: "Imagens/madeira.jpg",
    href: "produto.html?id=t001",
    gratis: true,  novo: false,
    tags: ["madeira", "pbr", "natural"],
  },
  {
    id: "t002", tipo: "textura", nome: "Tijolo Envelhecido",
    imagem: "Imagens/tijoloTextura.jpg",
    href: "produto.html?id=t002",
    gratis: false, novo: false,
    tags: ["tijolo", "arquitetura", "parede"],
  },
  {
    id: "t003", tipo: "textura", nome: "Superfície Madeirada",
    imagem: "Imagens/superfice.jpg",
    href: "produto.html?id=t003",
    gratis: false, novo: true,
    tags: ["madeira", "superficie", "piso"],
  },
  {
    id: "t004", tipo: "textura", nome: "Pedra com Veio",
    imagem: "Imagens/Pedra.jpg",
    href: "produto.html?id=t004",
    gratis: false, novo: false,
    tags: ["pedra", "natural", "arquitetura"],
  },
  {
    id: "t005", tipo: "textura", nome: "Mármore Escuro",
    imagem: "Imagens/marmore.jpg",
    href: "produto.html?id=t005",
    gratis: true,  novo: false,
    tags: ["marmore", "pedra", "luxo"],
  },
  {
    id: "t006", tipo: "textura", nome: "Metal Polido",
    imagem: "Imagens/Metal.jpg",
    href: "produto.html?id=t006",
    gratis: false, novo: false,
    tags: ["metal", "industrial"],
  },
  {
    id: "t007", tipo: "textura", nome: "Concreto Bruto",
    imagem: "Imagens/Concreto.jpg",
    href: "produto.html?id=t007",
    gratis: false, novo: false,
    tags: ["concreto", "arquitetura", "industrial"],
  },
  {
    id: "t008", tipo: "textura", nome: "Tecido Fino",
    imagem: "Imagens/Tecido.jpg",
    href: "produto.html?id=t008",
    gratis: true,  novo: true,
    tags: ["tecido", "organico", "mobiliario"],
  },
  {
    id: "t009", tipo: "textura", nome: "Vidro Fosco",
    imagem: "Imagens/Vidro.jpg",
    href: "produto.html?id=t009",
    gratis: false, novo: false,
    tags: ["vidro", "transparente", "arquitetura"],
  },
];

/* ─── Utilitários ─────────────────────────────────────────────── */

/**
 * Retorna true se o nome ou as tags do produto contêm o termo de busca.
 */
function correspondeBusca(produto, termo) {
  const t = termo.toLowerCase().trim();
  if (!t) return true;
  return (
    produto.nome.toLowerCase().includes(t) ||
    produto.tags.some(tag => tag.toLowerCase().includes(t))
  );
}

/**
 * Aplica o filtro ativo (todos / modelo / textura / gratis / novo)
 * sobre uma lista já filtrada por termo.
 */
function aplicarFiltro(produtos, filtro) {
  switch (filtro) {
    case "modelo":  return produtos.filter(p => p.tipo === "modelo");
    case "textura": return produtos.filter(p => p.tipo === "textura");
    case "gratis":  return produtos.filter(p => p.gratis);
    case "novo":    return produtos.filter(p => p.novo);
    default:        return produtos; /* todos */
  }
}

/* ─── Construção de cards ─────────────────────────────────────── */

function htmlCard(produto) {
  const tipoLabel = produto.tipo === "modelo" ? "Modelo 3D" : "Textura";

  const badgeGratis = produto.gratis
    ? `<span class="badge-resultado-gratis">Grátis</span>` : "";

  const badgeNovo = produto.novo
    ? `<span class="badge-resultado-novo">Novo</span>` : "";

  const badges = (produto.gratis || produto.novo)
    ? `<div class="badge-wrap">${badgeGratis}${badgeNovo}</div>` : "";

  return `
    <a href="${produto.href}" class="card-resultado-busca">
      <div class="imagem-wrap">
        <img src="${produto.imagem}" alt="${produto.nome}" loading="lazy">
      </div>
      <div class="info-card">
        <span class="tipo">${tipoLabel}</span>
        <span class="nome">${produto.nome}</span>
        ${badges}
      </div>
    </a>`;
}

/* ─── Renderização das grades ─────────────────────────────────── */

function renderizarSecao(gradeEl, contadorEl, btnEl, produtos) {
  /* Oculta seção inteira se não houver itens */
  const secao = gradeEl.closest(".secao-resultados");

  if (!produtos.length) {
    secao.style.display = "none";
    return;
  }

  secao.style.display = "";
  contadorEl.textContent = `${produtos.length} resultado${produtos.length !== 1 ? "s" : ""}`;
  gradeEl.innerHTML = produtos.map(htmlCard).join("");

  /* Recolhe se o btn já estava aberto ao trocar filtro */
  gradeEl.classList.remove("expandida");
  btnEl.classList.remove("aberto");
  btnEl.querySelector(".btn-expandir-texto").textContent = "Ver todos";
}

function renderizarPagina(termo, filtro) {
  const gradeModelos  = document.getElementById("grade-modelos");
  const gradeTexturas = document.getElementById("grade-texturas");
  const countModelos  = document.getElementById("count-modelos");
  const countTexturas = document.getElementById("count-texturas");
  const btnModelos    = document.getElementById("btn-modelos");
  const btnTexturas   = document.getElementById("btn-texturas");
  const totalEl       = document.getElementById("total-resultados");

  /* Filtra por termo de busca */
  const correspondentes = PRODUTOS_MOCK.filter(p => correspondeBusca(p, termo));

  /* Aplica filtro de tipo / gratis / novo */
  const filtrados = aplicarFiltro(correspondentes, filtro);

  /* Separa por tipo */
  const modelos  = filtrados.filter(p => p.tipo === "modelo");
  const texturas = filtrados.filter(p => p.tipo === "textura");

  /* Atualiza total */
  totalEl.textContent = filtrados.length;

  /* Renderiza seções */
  renderizarSecao(gradeModelos,  countModelos,  btnModelos,  modelos);
  renderizarSecao(gradeTexturas, countTexturas, btnTexturas, texturas);

  /* Mostra mensagem geral se não houver nada */
  const semResultados = document.getElementById("busca-pg-sem");
  if (!semResultados) return;
  semResultados.style.display = filtrados.length ? "none" : "";
}

/* ─── Expandir / recolher seção ──────────────────────────────── */

function configurarExpandir(btnId, gradeId) {
  const btn   = document.getElementById(btnId);
  const grade = document.getElementById(gradeId);
  if (!btn || !grade) return;

  btn.addEventListener("click", () => {
    const aberto = btn.classList.toggle("aberto");
    grade.classList.toggle("expandida", aberto);
    btn.querySelector(".btn-expandir-texto").textContent = aberto
      ? "Recolher"
      : "Ver todos";
  });
}

/* ─── Inicialização ───────────────────────────────────────────── */

document.addEventListener("DOMContentLoaded", () => {

  /* ── Lê o termo da URL ── */
  const params = new URLSearchParams(window.location.search);
  const termo  = params.get("q") || "";

  /* ── Preenche textos do cabeçalho ── */
  const display = termo ? `"${termo}"` : "todos os produtos";
  document.getElementById("titulo-termo").textContent      = display;
  document.getElementById("breadcrumb-termo").textContent  = termo || "todos";
  if (termo) document.title = `Busca: ${termo} — JoinRender`;

  /* ── Sincroniza input do header ── */
  const inputHeader = document.getElementById("input-busca-header");
  if (inputHeader && termo) inputHeader.value = termo;

  /* ── Filtro ativo inicial ── */
  let filtroAtivo = "todos";

  /* ── Renderização inicial ── */
  renderizarPagina(termo, filtroAtivo);

  /* ── Filtros rápidos ── */
  document.querySelectorAll(".filtro-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filtro-btn")
        .forEach(b => b.classList.remove("ativo"));
      btn.classList.add("ativo");
      filtroAtivo = btn.dataset.filtro;
      renderizarPagina(termo, filtroAtivo);
    });
  });

  /* ── Expandir / recolher ── */
  configurarExpandir("btn-modelos",  "grade-modelos");
  configurarExpandir("btn-texturas", "grade-texturas");
});