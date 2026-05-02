import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/* Painel de busca */
const barraPesquisa = document.querySelector(".barra-pesquisa input");
const overlay = document.querySelector(".overlay-busca");
const painel = document.querySelector(".painel-busca");

if (barraPesquisa && overlay && painel) {
  barraPesquisa.addEventListener("focus", () => {
    overlay.classList.add("ativo");
  });

  overlay.addEventListener("click", (e) => {
    if (!painel.contains(e.target)) {
      overlay.classList.remove("ativo");
    }
  });
}

/* Data no index */
(function () {
  const el = document.getElementById("dataHoje");
  if (!el) return;
  const agora = new Date();
  const formatada = agora.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  el.textContent = formatada;
})();

/* Carrossel */
const trilha = document.getElementById('nov-carrossel-trilha');
const botaoAnterior = document.getElementById('nov-anterior');
const botaoProximo = document.getElementById('nov-proximo');

if (trilha && botaoAnterior && botaoProximo) {
  let posicao = 0;

  function obterPasso() {
    const cartao = trilha.querySelector('.nov-carrossel-cartao');
    return cartao ? cartao.offsetWidth + 12 : 180;
  }

  function atualizarCarrossel() {
    const larguraMaxima = trilha.scrollWidth - trilha.parentElement.offsetWidth;
    posicao = Math.max(0, Math.min(posicao, larguraMaxima));
    trilha.style.transform = `translateX(-${posicao}px)`;
  }

  botaoProximo.addEventListener('click', () => {
    posicao += obterPasso() * 2;
    atualizarCarrossel();
  });

  botaoAnterior.addEventListener('click', () => {
    posicao -= obterPasso() * 2;
    atualizarCarrossel();
  });
}

/* Filtros */
const secaoFiltros = document.getElementById('nov-filtros');

if (secaoFiltros) {
  secaoFiltros.addEventListener('click', evento => {
    const botao = evento.target.closest('.nov-filtro');
    if (!botao) return;

    document.querySelectorAll('.nov-filtro').forEach(b => b.classList.remove('ativo'));
    botao.classList.add('ativo');

    const filtroSelecionado = botao.dataset.filtro;
    document.querySelectorAll('.nov-grade-cartao').forEach(cartao => {
      const visivel = filtroSelecionado === 'todos' || cartao.dataset.tipo === filtroSelecionado;
      cartao.style.display = visivel ? 'flex' : 'none';
    });
  });
}

/* Firebase — reutiliza app já inicializado pelo auth.js */
const firebaseConfig = {
  apiKey: "AIzaSyCG5CTMCU5Tm__Jx7AdIPFzqoyyjHgleU0",
  authDomain: "joinrender-2ac79.firebaseapp.com",
  projectId: "joinrender-2ac79",
  storageBucket: "joinrender-2ac79.firebasestorage.app",
  messagingSenderId: "786464902095",
  appId: "1:786464902095:web:c896cfb7fe22aed92ea0ba"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

function formatarData(timestamp) {
  if (!timestamp) return "";
  const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function criarCard(doc) {
  const p = doc.data();
  const id = doc.id;

  const imagemTag = p.imagem
    ? `<img src="${p.imagem}" alt="${p.nome}">`
    : `<div style="width:100%;height:100%;background:#2a1f1f;"></div>`;

  const badgeNovo   = p.novo   ? `<span class="badge-novo-cat">Novo</span>`     : "";
  const badgeGratis = p.gratis ? `<span class="badge-gratis-cat">Grátis</span>` : "";

  return `
    <a href="produto.html?id=${id}" class="card-categoria">
      ${imagemTag}
      ${badgeNovo}
      ${badgeGratis}
      <div class="card-categoria-info">
        <span class="card-categoria-nome">${p.nome || "Sem nome"}</span>
        <span class="card-categoria-tipo">${p.tipo || "Textura"}</span>
        <div class="card-categoria-meta">
          <span class="card-categoria-resolucao">${p.resolucao || ""}</span>
          <span class="card-categoria-data">${formatarData(p.criadoEm)}</span>
        </div>
      </div>
    </a>
  `;
}

async function carregarProdutos() {
  const grade    = document.getElementById("grade-produtos");
  const contagem = document.getElementById("contagem-produtos");
  if (!grade || !contagem) return;

  // Lê os parâmetros da URL (?tipo=modelo&cat=mobiliario)
  const params = new URLSearchParams(window.location.search);
  const tipo = params.get("tipo");  // ex: "modelo", "textura", "hdri"
  const cat  = params.get("cat");   // ex: "mobiliario", "cozinha", etc.

  // Atualiza o título da página com o nome da categoria
  const titulo = document.querySelector(".categoria-titulo");
  if (titulo && cat) {
    titulo.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
  }

  try {
    let q;

    if (tipo && cat) {
      q = query(
        collection(db, "produtos"),
        where("tipo", "==", tipo),
        where("categoria", "==", cat),
        orderBy("criadoEm", "desc")
      );
    } else if (cat) {
      q = query(
        collection(db, "produtos"),
        where("categoria", "==", cat),
        orderBy("criadoEm", "desc")
      );
    } else if (tipo) {
      q = query(
        collection(db, "produtos"),
        where("tipo", "==", tipo),
        orderBy("criadoEm", "desc")
      );
    } else {
      // Sem filtros: carrega tudo ordenado por data
      q = query(
        collection(db, "produtos"),
        orderBy("criadoEm", "desc")
      );
    }

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      contagem.textContent = "Nenhum produto encontrado";
      grade.innerHTML = "<p style='color:#aaa;padding:2rem;'>Nenhum produto nesta categoria ainda.</p>";
      return;
    }

    const total = snapshot.size;
    contagem.textContent = `${total} produto${total !== 1 ? "s" : ""}`;
    grade.innerHTML = snapshot.docs.map(criarCard).join("");

  } catch (erro) {
    console.error("Erro ao carregar produtos:", erro);
    grade.innerHTML = "<p style='color:#f66;padding:2rem;'>Erro ao carregar produtos. Verifique o console.</p>";
  }
}

carregarProdutos();