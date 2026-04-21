import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

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

/* carrousel */
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

/* ── FILTROS ── */
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
const firebaseConfig = {
  apiKey: "AIzaSyCG5CTMCU5Tm__Jx7AdIPFzqoyyjHgleU0",
  authDomain: "joinrender-2ac79.firebaseapp.com",
  projectId: "joinrender-2ac79",
  storageBucket: "joinrender-2ac79.firebasestorage.app",
  messagingSenderId: "786464902095",
  appId: "1:786464902095:web:c896cfb7fe22aed92ea0ba",
  measurementId: "G-DXF6PVHFXV"
};
 
const app = initializeApp(firebaseConfig);
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
 
  try {
    const q = query(
      collection(db, "produtos"),
      where("categoria", "==", "metais"),
      orderBy("criadoEm", "desc")
    );
 
    const snapshot = await getDocs(q);
 
    if (snapshot.empty) {
      contagem.textContent = "Nenhuma textura ainda";
      grade.innerHTML = "";
      return;
    }
 
    const total = snapshot.size;
    contagem.textContent = `${total} textura${total !== 1 ? "s" : ""} de metal`;
    grade.innerHTML = snapshot.docs.map(criarCard).join("");
 
  } catch (erro) {
    console.error("Erro ao carregar produtos:", erro);
    contagem.textContent = "";
    grade.innerHTML = "";
  }
}
 
carregarProdutos();
 

document.getElementById('su-botao-criar').addEventListener('click', () => {
  const nome = document.getElementById('su-nome').value.trim();
  const email = document.getElementById('su-email').value.trim();
  const senha = document.getElementById('su-senha').value;
  const termos = document.getElementById('su-check-termos').checked;

  if (!nome || !email || !senha) {
    alert('Preencha todos os campos obrigatórios.');
    return;
  }
  if (senha.length < 8) {
    alert('A senha deve ter pelo menos 8 caracteres.');
    return;
  }
  if (!termos) {
    alert('Aceite os termos para continuar.');
    return;
  }
  // Integrar com Firebase: createUserWithEmailAndPassword(auth, email, senha)
});