/* ═══════════════════════════════════════════════════════════════════════════
   perfil.js — Lógica da página "Meu Perfil"

   Fluxo:
   1. Aguarda o Firebase Auth resolver o estado do usuário.
   2. Se não logado → redireciona para login.html.
   3. Renderiza o card do usuário (avatar, nome, email, provedor, botão sair).
   4. Busca os downloads do usuário no Firestore.
   5. Para cada download, carrega nome e imagem do produto.
   6. Salva resultado no localStorage (chave: perfil_hist_<uid>).
   7. Renderiza a lista de downloads.
   ═══════════════════════════════════════════════════════════════════════════ */

import { app } from "../nucleo/config.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
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

// ── Elementos ────────────────────────────────────────────────────────────────
const cardArea  = document.getElementById("perfil-card-area");
const historico = document.getElementById("perfil-historico");
const contagem  = document.getElementById("perfil-contagem");

// ── Chave de cache localStorage ──────────────────────────────────────────────
function chaveCache(uid) {
  return `perfil_hist_${uid}`;
}

// ── Formata timestamp Firestore ou número para string legível ─────────────────
function formatarData(ts) {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString("pt-BR", {
    day:   "2-digit",
    month: "short",
    year:  "numeric"
  });
}

// ── Mapeia providerId para nome legível ──────────────────────────────────────
function nomePorProvedor(providerId) {
  const mapa = {
    "google.com":   "Google",
    "github.com":   "GitHub",
    "twitter.com":  "Twitter",
    "password":     "Email"
  };
  return mapa[providerId] ?? providerId;
}

// ── Renderiza o card do usuário ──────────────────────────────────────────────
function renderizarCard(usuario) {
  const nome  = usuario.displayName || usuario.email?.split("@")[0] || "Usuário";
  const email = usuario.email || "";

  // Avatar ou placeholder
  const avatarHtml = usuario.photoURL
    ? `<img class="perfil-avatar" src="${usuario.photoURL}" alt="Foto de ${nome}">`
    : `<div class="perfil-avatar-placeholder" aria-hidden="true">
         <i class="fi fi-rr-user"></i>
       </div>`;

  // Badges de provedores
  const badges = (usuario.providerData || [])
    .map(p => `<span class="perfil-badge">${nomePorProvedor(p.providerId)}</span>`)
    .join("");

  cardArea.innerHTML = `
    <div class="perfil-card">
      ${avatarHtml}
      <div class="perfil-info">
        <h1 class="perfil-nome">${nome}</h1>
        ${email ? `<p class="perfil-email">${email}</p>` : ""}
        <div class="perfil-badges">${badges}</div>
      </div>
      <button class="perfil-btn-sair" id="perfil-btn-sair" type="button">
        <i class="fi fi-rr-sign-out-alt" aria-hidden="true"></i>
        Sair
      </button>
    </div>
  `;

  document.getElementById("perfil-btn-sair")?.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
}

// ── Renderiza estado vazio / erro ─────────────────────────────────────────────
function renderizarEstado(icone, mensagem, extra = "") {
  historico.innerHTML = `
    <div class="perfil-estado">
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
  lista.className = "perfil-lista";

  itens.forEach(item => {
    const link = document.createElement("a");
    link.className = "perfil-item";
    link.href = `produto.html?id=${item.produtoId}`;

    const imgHtml = item.urlImagem
      ? `<img class="perfil-item-img" src="${item.urlImagem}" alt="${item.nome}" loading="lazy">`
      : `<div class="perfil-item-img-placeholder" aria-hidden="true">
           <i class="fi fi-rr-picture"></i>
         </div>`;

    link.innerHTML = `
      ${imgHtml}
      <div class="perfil-item-info">
        <p class="perfil-item-nome">${item.nome || "Asset sem nome"}</p>
        <p class="perfil-item-data">Baixado em ${item.dataFormatada}</p>
      </div>
      <i class="fi fi-rr-angle-right perfil-item-seta" aria-hidden="true"></i>
    `;

    lista.appendChild(link);
  });

  // Botão limpar cache
  const rodape = document.createElement("div");
  rodape.className = "perfil-rodape";
  rodape.innerHTML = `
    <button class="perfil-btn-limpar" id="perfil-btn-limpar" type="button">
      Limpar cache local
    </button>
  `;

  historico.innerHTML = "";
  historico.appendChild(lista);
  historico.appendChild(rodape);

  document.getElementById("perfil-btn-limpar")?.addEventListener("click", () => {
    const uid = auth.currentUser?.uid;
    if (uid) {
      localStorage.removeItem(chaveCache(uid));
      alert("Cache local removido. Os dados continuam salvos na nuvem.");
    }
  });
}

// ── Busca os downloads do Firestore ──────────────────────────────────────────
async function carregarHistorico(uid) {
  // 1. Carrega do cache para resposta imediata
  const cacheRaw = localStorage.getItem(chaveCache(uid));
  if (cacheRaw) {
    try {
      renderizarLista(JSON.parse(cacheRaw));
    } catch {
      // cache corrompido — ignora
    }
  }

  // 2. Busca no Firestore
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

    // 3. Enriquece cada registro com dados do produto
    const itens = await Promise.all(
      snap.docs.map(async (registro) => {
        const dados = registro.data();
        let nome      = "Asset sem nome";
        let urlImagem = "";

        try {
          const prodSnap = await getDoc(doc(db, "produtos", dados.produtoId));
          if (prodSnap.exists()) {
            const prod = prodSnap.data();
            nome      = prod.nome      || nome;
            urlImagem = prod.urlImagem || "";
          }
        } catch {
          // produto removido ou inacessível — usa padrão
        }

        return {
          produtoId:     dados.produtoId,
          nome,
          urlImagem,
          dataFormatada: formatarData(dados.criadoEm),
          _ts: dados.criadoEm?.toMillis?.() ?? Date.now()
        };
      })
    );

    // 4. Atualiza cache
    localStorage.setItem(chaveCache(uid), JSON.stringify(itens));

    // 5. Renderiza lista atualizada
    renderizarLista(itens);

  } catch (erro) {
    console.error("Erro ao carregar histórico:", erro);
    if (!cacheRaw) {
      renderizarEstado("warning", "Não foi possível carregar o histórico. Tente novamente.");
    }
  }
}

// ── Ponto de entrada ─────────────────────────────────────────────────────────
onAuthStateChanged(auth, (usuario) => {
  if (!usuario) {
    // Não logado → redireciona para login passando origem para voltar depois
    window.location.href = `login.html?redirect=perfil.html`;
    return;
  }

  renderizarCard(usuario);
  carregarHistorico(usuario.uid);
});