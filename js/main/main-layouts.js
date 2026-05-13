import "../nucleo/auth.js";
import "../nucleo/script.js";
import "../nucleo/busca.js";
import "../nucleo/nav-mobile.js";
import "../nucleo/jornal.js";
import { buscarProdutos, buscarProdutoPorId } from "../nucleo/db.js";

// ── Cards dinâmicos de Modelos 3D na home ──────────────────────────────────────

const ID_DONUT = "VJKDPjJvlkjWTq5oVKP6";

const FALLBACK_CARDS = [
  {
    imagemUrl: "assets/imagens/CardIndex1.webp",
    nome: "Barris Radioativos",
    categoria: "Modelo High-poly",
    slug: null,
  },
  {
    imagemUrl: "assets/imagens/CardIndex2.webp",
    nome: "Katana Neon",
    categoria: "Modelo com emissivos",
    slug: null,
  },
  {
    imagemUrl: "assets/imagens/CardIndex3.webp",
    nome: "Sport Car",
    categoria: "Veículo PBR",
    slug: null,
  },
];

function criarCardHTML(produto) {
  const href      = produto.id ? `paginas/produto.html?id=${produto.id}` : (produto.slug ? `paginas/produto.html?id=${produto.slug}` : "paginas/produto.html");
  const categoria = produto.categoria || produto.tipo || "Modelo 3D";
  const nome      = produto.nome      || "Modelo 3D";
  const imagem    = produto.urlImagem || produto.imagemUrl || produto.imagem || "assets/imagens/CardIndex1.webp";

  return `
    <article class="card-article">
      <img src="${imagem}" class="card-imagem-index" alt="${nome}" loading="lazy">
      <div class="card-data">
        <span class="card-descricao">${categoria}</span>
        <h3 class="card-titulo">${nome}</h3>
        <a href="${href}" class="botao-card">Ver modelo</a>
      </div>
    </article>`;
}

async function carregarCardsModelos() {
  const container = document.getElementById("cards-modelos-home");
  if (!container) return;

  try {
    const [donut, demais] = await Promise.all([
      buscarProdutoPorId(ID_DONUT),
      buscarProdutos({ tipo: "modelo", limite: 10 }),
    ]);

    // Remove o donut da lista geral para não duplicar
    const semDonut = demais.filter(p => p.id !== ID_DONUT);

    // Monta lista: donut primeiro, depois os demais até completar 3
    const lista = [donut, ...semDonut].filter(Boolean).slice(0, 3);

    // Completa com fallbacks se vier menos de 3
    while (lista.length < 3) lista.push(FALLBACK_CARDS[lista.length]);

    container.innerHTML = lista.map(criarCardHTML).join("");
  } catch (err) {
    console.warn("[home] Erro ao carregar modelos, usando fallback:", err);
    container.innerHTML = FALLBACK_CARDS.map(criarCardHTML).join("");
  }
}

carregarCardsModelos();