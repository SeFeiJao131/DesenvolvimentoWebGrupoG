import { buscarProdutoPorId, registrarDownload, usuarioJaBaixou } from "./db.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyCG5CTMCU5Tm__Jx7AdIPFzqoyyjHgleU0",
  authDomain: "joinrender-2ac79.firebaseapp.com",
  projectId: "joinrender-2ac79",
  storageBucket: "joinrender-2ac79.firebasestorage.app",
  messagingSenderId: "786464902095",
  appId: "1:786464902095:web:c896cfb7fe22aed92ea0ba"
};
const app  = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

const params = new URLSearchParams(window.location.search);
const produtoId = params.get("id");

if (!produtoId) {
  mostrarErro("Produto não encontrado.");
} else {
  carregarProduto();
}

async function carregarProduto() {
  try {
    const produto = await buscarProdutoPorId(produtoId);
    if (!produto || !produto.ativo) {
      mostrarErro("Produto não encontrado ou indisponível.");
      return;
    }
    preencherPagina(produto);
    configurarDownload(produto);
  } catch (e) {
    mostrarErro("Erro ao carregar produto: " + e.message);
  }
}

function preencherPagina(produto) {
  document.title = `${produto.nome} — JoinRender`;

  const elNome = document.querySelector(".nome-pgProduto");
  if (elNome) elNome.textContent = produto.nome;

  const elDesc = document.querySelector(".linha-descricao-pgProduto p");
  if (elDesc) elDesc.textContent = produto.descricao || "Sem descrição.";

  const elPreco = document.querySelector(".preco-pgProduto");
  if (elPreco) {
    elPreco.textContent = produto.gratuito
      ? "Gratuito"
      : `R$ ${Number(produto.preco).toFixed(2)}`;
  }

  // Especificações
  atualizarSpec("Resolução",    produto.resolucao || "—");
  atualizarSpec("Formato",      (produto.formato || []).join(", ") || "—");
  atualizarSpec("Armazenamento", produto.tamanhoMB ? `${produto.tamanhoMB} MB` : "—");

  const blocos = document.querySelectorAll(".bloco-sr-pgProduto");
  if (blocos[0]) {
    blocos[0].querySelector(".valor-sr-pgProduto").textContent =
      (produto.suporte || []).join(", ") || "—";
  }
  if (blocos[1]) {
    blocos[1].querySelector(".valor-sr-pgProduto").textContent =
      (produto.render || []).join(", ") || "—";
  }

  const placeholder = document.querySelector(".placeholder-visualizador-pgProduto");
  if (placeholder && produto.urlImagem) {
    placeholder.style.backgroundImage = `url('${produto.urlImagem}')`;
    placeholder.style.backgroundSize  = "cover";
    placeholder.style.backgroundPosition = "center";
  }

  const caminho = document.querySelector(".caminho-pgProduto");
  if (caminho) {
    const tipoLabel = produto.tipo === "textura" ? "texturas"
                    : produto.tipo === "modelo"  ? "modelos 3D"
                    : "HDRIs";
    const tipoHref  = produto.tipo === "textura" ? "LayoutTexturas.html"
                    : produto.tipo === "modelo"  ? "LayoutModelos.html"
                    : "LayoutHdri.html";
    caminho.innerHTML = `
      <a href="index.html">Home</a><span>/</span>
      <a href="${tipoHref}">${tipoLabel}</a><span>/</span>
      <span>${produto.nome}</span>
    `;
  }
}

function atualizarSpec(chave, valor) {
  const linhas = document.querySelectorAll(".linha-spec-pgProduto");
  linhas.forEach(linha => {
    const label = linha.querySelector(".chave-spec-pgProduto");
    if (label && label.textContent.trim() === chave) {
      const val = linha.querySelector(".valor-spec-pgProduto");
      if (val) val.textContent = valor;
    }
  });
}

function configurarDownload(produto) {
  const botao = document.querySelector(".botao-download-pgProduto");
  if (!botao) return;

  onAuthStateChanged(auth, async (usuario) => {
    if (!usuario) {
      // Não logado
      botao.textContent = produto.gratuito ? "Login para baixar" : "Login para comprar";
      botao.onclick = () => { window.location.href = "login.html"; };
      return;
    }

    const jaBaixou = await usuarioJaBaixou(produtoId);

    if (jaBaixou) {
      botao.textContent = "✓ Já baixado";
      botao.style.opacity = "0.7";
      botao.onclick = null;
      return;
    }

    if (!produto.gratuito) {
      botao.textContent = `Comprar — R$ ${Number(produto.preco).toFixed(2)}`;
      botao.onclick = () => {
        alert("Integração de pagamento em breve.");
      };
      return;
    }

    // Gratuito e logado
    botao.textContent = "Download gratuito";
    botao.onclick = async () => {
      botao.disabled = true;
      botao.textContent = "Baixando...";

      const ok = await registrarDownload(produtoId);
      if (ok) {
        botao.textContent = "✓ Download iniciado";
      } else {
        botao.textContent = "Erro. Tente novamente.";
        botao.disabled = false;
      }
    };
  });
}

function mostrarErro(msg) {
  document.querySelector(".nome-pgProduto").textContent = "Produto não encontrado";
  document.querySelector(".linha-descricao-pgProduto p").textContent = msg;
}