/* ═══════════════════════════════════════════════════════════════════════════
   historico.js — Lógica da página "Meus Downloads"

   Fluxo:
   1. Aguarda o Firebase Auth resolver o estado do usuário.
   2. Se não há usuário logado → exibe mensagem pedindo login.
   3. Busca os registros da coleção "downloads" filtrados pelo uid.
   4. Para cada registro, carrega os dados do produto (nome, imagem).
   5. Armazena o resultado em localStorage como cache (chave: hist_<uid>).
   6. Renderiza a lista ordenada do mais recente para o mais antigo.
   7. Botão "Limpar histórico local" apaga o cache do localStorage.
   ═══════════════════════════════════════════════════════════════════════════ */

import { app } from "../nucleo/config.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db   = getFirestore(app);

// ── Elementos da página ───────────────────────────────────────────────────────
const conteudo  = document.getElementById("hist-conteudo");
const contagem  = document.getElementById("hist-contagem");

// ── Chave de cache no localStorage ───────────────────────────────────────────
function chaveCache(uid) {
  return `hist_${uid}`;
}

// ── Formata timestamp Firestore ou Date para string legível ──────────────────
function formatarData(ts) {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

// ── Renderiza estado vazio / sem login / erro ─────────────────────────────────
function renderizarEstado(icone, mensagem, extra = "") {
  conteudo.innerHTML = `
    <div class="hist-estado">
      <i class="fi fi-rr-${icone}" aria-hidden="true"></i>
      <span>${mensagem}</span>
      ${extra}
    </div>
  `;
}

// ── Renderiza a lista de downloads ───────────────────────────────────────────
function renderizarLista(itens) {
  if (itens.length === 0) {
    renderizarEstado(
      "inbox-out",
      "Você ainda não baixou nenhum asset.",
      `<a href="../index.html">Explorar o catálogo →</a>`
    );
    return;
  }

  contagem.textContent = `${itens.length} ${itens.length === 1 ? "item" : "itens"}`;

  const lista = document.createElement("div");
  lista.className = "hist-lista";

  itens.forEach(item => {
    const link = document.createElement("a");
    link.className = "hist-item";
    link.href = `produto.html?id=${item.produtoId}`;

    // Imagem ou placeholder
    const imgHtml = item.urlImagem
      ? `<img class="hist-item-img" src="${item.urlImagem}" alt="${item.nome}" loading="lazy">`
      : `<div class="hist-item-img-placeholder" aria-hidden="true">
           <i class="fi fi-rr-picture"></i>
         </div>`;

    link.innerHTML = `
      ${imgHtml}
      <div class="hist-item-info">
        <p class="hist-item-nome">${item.nome || "Asset sem nome"}</p>
        <p class="hist-item-data">Baixado em ${item.dataFormatada}</p>
      </div>
      <i class="fi fi-rr-angle-right hist-item-seta" aria-hidden="true"></i>
    `;

    lista.appendChild(link);
  });

  // Botão para limpar cache local
  const rodape = document.createElement("div");
  rodape.className = "hist-rodape";
  rodape.innerHTML = `
    <button class="hist-btn-limpar" id="hist-btn-limpar" type="button">
      Limpar cache local
    </button>
  `;

  conteudo.innerHTML = "";
  conteudo.appendChild(lista);
  conteudo.appendChild(rodape);

  document.getElementById("hist-btn-limpar")?.addEventListener("click", () => {
    const uid = auth.currentUser?.uid;
    if (uid) {
      localStorage.removeItem(chaveCache(uid));
      alert("Cache local removido. Os dados continuam salvos na nuvem.");
    }
  });
}

// ── Busca os downloads do usuário no Firestore ────────────────────────────────
async function carregarHistorico(uid) {
  // 1. Tenta carregar do cache primeiro para resposta imediata
  const cache = localStorage.getItem(chaveCache(uid));
  if (cache) {
    try {
      const itensCache = JSON.parse(cache);
      renderizarLista(itensCache);
    } catch {
      // cache corrompido — ignora e continua para o Firestore
    }
  }

  // 2. Busca registros da coleção "downloads" do usuário
  try {
    const q = query(
      collection(db, "downloads"),
      where("usuarioId", "==", uid),
      orderBy("criadoEm", "desc")
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      renderizarEstado(
        "inbox-out",
        "Você ainda não baixou nenhum asset.",
        `<a href="../index.html">Explorar o catálogo →</a>`
      );
      localStorage.removeItem(chaveCache(uid));
      return;
    }

    // 3. Para cada download, busca os dados do produto
    const itens = await Promise.all(
      snap.docs.map(async (registro) => {
        const dados = registro.data();
        let nome       = "Asset sem nome";
        let urlImagem  = "";

        try {
          const prodSnap = await getDoc(doc(db, "produtos", dados.produtoId));
          if (prodSnap.exists()) {
            const prod = prodSnap.data();
            nome      = prod.nome      || nome;
            urlImagem = prod.urlImagem || "";
          }
        } catch {
          // produto não encontrado ou removido — usa valores padrão
        }

        return {
          produtoId:    dados.produtoId,
          nome,
          urlImagem,
          dataFormatada: formatarData(dados.criadoEm),
          // Guarda timestamp como número para poder salvar no localStorage
          _ts: dados.criadoEm?.toMillis?.() ?? Date.now()
        };
      })
    );

    // 4. Salva no localStorage como cache
    localStorage.setItem(chaveCache(uid), JSON.stringify(itens));

    // 5. Renderiza
    renderizarLista(itens);

  } catch (erro) {
    console.error("Erro ao carregar histórico:", erro);
    // Se já havia cache, mantém ele na tela (já renderizado acima)
    // Caso contrário, mostra erro
    if (!cache) {
      renderizarEstado("warning", "Não foi possível carregar o histórico. Tente novamente.");
    }
  }
}

// ── Ponto de entrada: aguarda o estado de autenticação ───────────────────────
onAuthStateChanged(auth, (usuario) => {
  if (!usuario) {
    renderizarEstado(
      "lock",
      "Faça login para ver seu histórico de downloads.",
      `<a href="login.html">Entrar na conta →</a>`
    );
    return;
  }

  carregarHistorico(usuario.uid);
});