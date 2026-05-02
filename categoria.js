import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/* Firebase */
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
        <span class="card-categoria-tipo">${p.tipo || ""}</span>
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

  const params = new URLSearchParams(window.location.search);
  const tipo = params.get("tipo");
  const cat  = params.get("cat");

  // Atualiza título
  const titulo = document.querySelector(".categoria-titulo");
  if (titulo && cat) {
    titulo.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
  }

  try {
    let q;

    // Sem orderBy — ordenação feita no JS para evitar índice composto
    if (tipo && cat) {
      q = query(
        collection(db, "produtos"),
        where("tipo", "==", tipo),
        where("categorias", "array-contains", cat)
      );
    } else if (cat) {
      q = query(
        collection(db, "produtos"),
        where("categorias", "array-contains", cat)
      );
    } else if (tipo) {
      q = query(
        collection(db, "produtos"),
        where("tipo", "==", tipo)
      );
    } else {
      q = query(collection(db, "produtos"));
    }

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      contagem.textContent = "Nenhum produto encontrado";
      grade.innerHTML = "<p style='color:#aaa;padding:2rem;'>Nenhum produto nesta categoria ainda.</p>";
      return;
    }

    // Ordena por data no JavaScript
    const docs = snapshot.docs.sort((a, b) => {
      const dataA = a.data().criadoEm?.toDate?.() ?? new Date(0);
      const dataB = b.data().criadoEm?.toDate?.() ?? new Date(0);
      return dataB - dataA; // mais recente primeiro
    });

    const total = docs.length;
    contagem.textContent = `${total} produto${total !== 1 ? "s" : ""}`;
    grade.innerHTML = docs.map(criarCard).join("");

  } catch (erro) {
    console.error("Erro ao carregar produtos:", erro);
    grade.innerHTML = "<p style='color:#f66;padding:2rem;'>Erro ao carregar produtos. Verifique o console.</p>";
  }
}

carregarProdutos();