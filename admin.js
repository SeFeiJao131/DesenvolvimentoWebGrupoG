/* ─────────────────────────────────────────────────────────────────────────────
   admin.js — Painel de administração JoinRender
   CORREÇÕES:
   1. Removida duplicação do firebaseConfig — agora importa de config.js
   2. initializeApp/getApps removidos — app já vem inicializado do config.js
   3. Indentação padronizada (o original usava 4 espaços dentro de bloco desnecessário)
   ───────────────────────────────────────────────────────────────────────────── */

import {
  buscarProdutos,
  criarProduto,
  atualizarProduto,
  buscarProdutoPorId,
} from "./db.js";

import { algoliaUpsert, algoliaDelete } from "./algolia.js";

// CORREÇÃO: importa o app já inicializado de config.js
// em vez de redeclarar firebaseConfig aqui (era duplicação do config.js)
import { app } from "./config.js";

import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-storage.js";

// ── Firebase Storage ─────────────────────────────────────────────────────────
const storage = getStorage(app);

// ── Estado dos uploads ────────────────────────────────────────────────────────
// Guarda as URLs já enviadas ao Storage enquanto o modal está aberto
const urlsUpload = { imagem: "", arquivo: "", modelo: "" };

// ── Navegação sidebar ─────────────────────────────────────────────────────────
document.querySelectorAll(".nav-item[data-secao]").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("ativo"));
    item.classList.add("ativo");
    const alvo = item.dataset.secao;
    document.querySelectorAll(".secao").forEach(s => s.classList.remove("ativa"));
    if (alvo === "novo") {
      document.getElementById("secao-produtos").classList.add("ativa");
      abrirModal();
    } else {
      document.getElementById(`secao-${alvo}`)?.classList.add("ativa");
    }
  });
});

// ── Carrega produtos ──────────────────────────────────────────────────────────
let produtos = [];
let produtoEditandoId = null;

const conteudoTabela = document.getElementById("conteudo-tabela");
const buscaInput     = document.getElementById("busca-input");
const filtroTipo     = document.getElementById("filtro-tipo");
const modalOverlay   = document.getElementById("modal-overlay");
const mensagemLista  = document.getElementById("mensagem-lista");
const mensagemModal  = document.getElementById("mensagem-modal");

async function carregarProdutos() {
  try {
    produtos = await buscarProdutos({ limite: 200 });
    atualizarStats();
    renderizarTabela(produtos);
  } catch (e) {
    conteudoTabela.innerHTML = `<div class="loading">Erro ao carregar produtos.<br><small>${e.message}</small></div>`;
  }
}

function atualizarStats() {
  document.getElementById("stat-total").textContent    = produtos.length;
  document.getElementById("stat-texturas").textContent = produtos.filter(p => p.tipo === "textura").length;
  document.getElementById("stat-modelos").textContent  = produtos.filter(p => p.tipo === "modelo").length;
  document.getElementById("stat-hdris").textContent    = produtos.filter(p => p.tipo === "hdri").length;
}

function badgeTipo(tipo) {
  const map = {
    textura: ["badge-textura", "Textura"],
    modelo:  ["badge-modelo",  "Modelo 3D"],
    hdri:    ["badge-hdri",    "HDRI"],
  };
  const [cls, label] = map[tipo] || ["", "—"];
  return `<span class="badge ${cls}">${label}</span>`;
}

function badgePreco(p) {
  if (!p.ativo) return `<span class="badge badge-rascunho">Rascunho</span>`;
  return p.gratuito
    ? `<span class="badge badge-gratis">Grátis</span>`
    : `<span class="badge badge-pago">R$ ${Number(p.preco).toFixed(2)}</span>`;
}

function renderizarTabela(lista) {
  if (!lista.length) {
    conteudoTabela.innerHTML = `<div class="loading">Nenhum produto encontrado.</div>`;
    return;
  }
  conteudoTabela.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Tipo</th>
          <th>Preço</th>
          <th>Downloads</th>
          <th>Arquivo</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${lista.map(p => `
          <tr>
            <td style="display:flex;align-items:center;gap:10px;">
              ${p.urlImagem
                ? `<img src="${p.urlImagem}" style="width:36px;height:36px;object-fit:cover;border-radius:6px;" />`
                : `<div style="width:36px;height:36px;background:var(--painel2);border-radius:6px;"></div>`
              }
              ${p.nome || "—"}
            </td>
            <td>${badgeTipo(p.tipo)}</td>
            <td>${badgePreco(p)}</td>
            <td>${p.downloads ?? 0}</td>
            <td>
              ${p.urlArquivo
                ? `<span style="color:#6ee7b7;font-size:0.78rem;">✓ Arquivo</span>`
                : `<span style="color:var(--texto-suave);font-size:0.78rem;">— sem arquivo</span>`
              }
              ${p.urlModelo
                ? ` <span style="color:#fbbf24;font-size:0.78rem;margin-left:6px;">✓ 3D</span>`
                : ""
              }
            </td>
            <td>
              <div class="acoes-td">
                <button class="btn-mini" onclick="editarProduto('${p.id}')">Editar</button>
                <button class="btn-mini perigo" onclick="confirmarDesativar('${p.id}', '${(p.nome || "").replace(/'/g, "\\'")}')">
                  ${p.ativo ? "Desativar" : "Ativar"}
                </button>
              </div>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function filtrar() {
  const termo = buscaInput.value.toLowerCase();
  const tipo  = filtroTipo.value;
  const lista = produtos.filter(p =>
    (!tipo  || p.tipo === tipo) &&
    (!termo || (p.nome || "").toLowerCase().includes(termo))
  );
  renderizarTabela(lista);
}
buscaInput.addEventListener("input", filtrar);
filtroTipo.addEventListener("change", filtrar);

// ── Modal: abrir / fechar ─────────────────────────────────────────────────────
function abrirModal(produto = null) {
  produtoEditandoId = produto?.id || null;
  document.getElementById("modal-titulo").textContent = produto ? "Editar produto" : "Novo produto";
  mensagemModal.className  = "mensagem";
  mensagemModal.textContent = "";

  urlsUpload.imagem  = "";
  urlsUpload.arquivo = "";
  urlsUpload.modelo  = "";

  document.getElementById("f-nome").value       = produto?.nome       || "";
  document.getElementById("f-tipo").value       = produto?.tipo       || "";
  document.getElementById("f-preco").value      = produto?.preco      ?? 0;
  document.getElementById("f-descricao").value  = produto?.descricao  || "";
  document.getElementById("f-resolucao").value  = produto?.resolucao  || "";
  document.getElementById("f-tamanho").value    = produto?.tamanhoMB  || "";
  document.getElementById("f-formatos").value   = (produto?.formato   || []).join(", ");
  document.getElementById("f-suporte").value    = (produto?.suporte   || []).join(", ");
  document.getElementById("f-render").value     = (produto?.render    || []).join(", ");
  document.getElementById("f-tags").value       = (produto?.tags      || []).join(", ");
  document.getElementById("f-categorias").value = (produto?.categorias|| []).join(", ");
  document.getElementById("f-destaque").checked = produto?.destaque   || false;
  document.getElementById("f-ativo").checked    = produto?.ativo      ?? true;

  document.getElementById("f-imagem").value   = produto?.urlImagem  || "";
  document.getElementById("f-arquivo").value  = produto?.urlArquivo || "";
  document.getElementById("f-modelo").value   = produto?.urlModelo  || "";

  const previewImg = document.getElementById("preview-imagem");
  if (produto?.urlImagem) {
    previewImg.src = produto.urlImagem;
    previewImg.classList.add("visivel");
  } else {
    previewImg.src = "";
    previewImg.classList.remove("visivel");
  }

  ["imagem", "arquivo", "modelo"].forEach(k => {
    document.getElementById(`nome-${k}`).textContent = "Nenhum arquivo selecionado";
    document.getElementById(`prog-${k}`).classList.remove("visivel");
    document.getElementById(`barra-${k}`).style.width = "0%";
    document.getElementById(`url-${k}-preview`).textContent = "";
    document.getElementById(`url-${k}-preview`).classList.remove("visivel");
  });

  if (produto?.urlArquivo) { urlsUpload.arquivo = produto.urlArquivo; mostrarUrlPreview("arquivo", produto.urlArquivo); }
  if (produto?.urlModelo)  { urlsUpload.modelo  = produto.urlModelo;  mostrarUrlPreview("modelo",  produto.urlModelo);  }
  if (produto?.urlImagem)  { urlsUpload.imagem  = produto.urlImagem; }

  modalOverlay.classList.add("aberto");
}

function fecharModal() {
  modalOverlay.classList.remove("aberto");
  produtoEditandoId = null;
}

document.getElementById("btn-abrir-modal").addEventListener("click", () => abrirModal());
document.getElementById("btn-cancelar").addEventListener("click", fecharModal);
modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) fecharModal(); });

// ── Upload para Firebase Storage ──────────────────────────────────────────────
function configurarUpload(btnId, inputId, campo, pasta) {
  const btn   = document.getElementById(btnId);
  const input = document.getElementById(inputId);

  btn.addEventListener("click", () => input.click());

  input.addEventListener("change", async () => {
    const arquivo = input.files[0];
    if (!arquivo) return;

    document.getElementById(`nome-${campo}`).textContent = arquivo.name;

    const ext       = arquivo.name.split(".").pop();
    const nomeFinal = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const storageRef = ref(storage, `${pasta}/${nomeFinal}`);

    const progWrapper = document.getElementById(`prog-${campo}`);
    const progBarra   = document.getElementById(`barra-${campo}`);
    progWrapper.classList.add("visivel");
    progBarra.style.width = "0%";

    const uploadTask = uploadBytesResumable(storageRef, arquivo);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        progBarra.style.width = `${pct}%`;
      },
      (erro) => {
        console.error(`[upload ${campo}]`, erro);
        mostrarMensagem(mensagemModal, "erro", `Erro no upload de ${campo}: ${erro.message}`);
        progWrapper.classList.remove("visivel");
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        urlsUpload[campo] = url;

        const inputUrl = document.getElementById(
          campo === "imagem" ? "f-imagem" : campo === "arquivo" ? "f-arquivo" : "f-modelo"
        );
        if (inputUrl) inputUrl.value = url;

        mostrarUrlPreview(campo, url);

        if (campo === "imagem") {
          const prev = document.getElementById("preview-imagem");
          prev.src = url;
          prev.classList.add("visivel");
        }
      }
    );
  });
}

function mostrarUrlPreview(campo, url) {
  const el = document.getElementById(`url-${campo}-preview`);
  if (!el) return;
  const curta = url.length > 60 ? url.slice(0, 57) + "…" : url;
  el.textContent = `✓ ${curta}`;
  el.classList.add("visivel");
}

configurarUpload("btn-escolher-imagem",  "input-imagem",  "imagem",  "capas");
configurarUpload("btn-escolher-arquivo", "input-arquivo", "arquivo", "assets");
configurarUpload("btn-escolher-modelo",  "input-modelo",  "modelo",  "modelos3d");

document.getElementById("f-imagem").addEventListener("input",  e => { urlsUpload.imagem  = e.target.value.trim(); });
document.getElementById("f-arquivo").addEventListener("input", e => { urlsUpload.arquivo = e.target.value.trim(); });
document.getElementById("f-modelo").addEventListener("input",  e => { urlsUpload.modelo  = e.target.value.trim(); });

// ── Salvar produto no Firestore ───────────────────────────────────────────────
document.getElementById("btn-salvar").addEventListener("click", async () => {
  const nome = document.getElementById("f-nome").value.trim();
  const tipo = document.getElementById("f-tipo").value;

  if (!nome || !tipo) {
    mostrarMensagem(mensagemModal, "erro", "Preencha os campos obrigatórios: nome e tipo.");
    return;
  }

  const urlImagem  = urlsUpload.imagem  || document.getElementById("f-imagem").value.trim();
  const urlArquivo = urlsUpload.arquivo || document.getElementById("f-arquivo").value.trim();
  const urlModelo  = urlsUpload.modelo  || document.getElementById("f-modelo").value.trim();

  const dados = {
    nome,
    tipo,
    preco:      parseFloat(document.getElementById("f-preco").value) || 0,
    descricao:  document.getElementById("f-descricao").value.trim(),
    resolucao:  document.getElementById("f-resolucao").value.trim(),
    tamanhoMB:  parseFloat(document.getElementById("f-tamanho").value) || 0,
    formato:    document.getElementById("f-formatos").value.split(",").map(s => s.trim()).filter(Boolean),
    suporte:    document.getElementById("f-suporte").value.split(",").map(s => s.trim()).filter(Boolean),
    render:     document.getElementById("f-render").value.split(",").map(s => s.trim()).filter(Boolean),
    tags:       document.getElementById("f-tags").value.split(",").map(s => s.trim()).filter(Boolean),
    categorias: document.getElementById("f-categorias").value.split(",").map(s => s.trim().toLowerCase()).filter(Boolean),
    urlImagem,
    urlArquivo,
    urlModelo,
    destaque:   document.getElementById("f-destaque").checked,
    ativo:      document.getElementById("f-ativo").checked,
  };

  const btnSalvar = document.getElementById("btn-salvar");
  btnSalvar.disabled = true;
  btnSalvar.textContent = "Salvando...";

  try {
    if (produtoEditandoId) {
      await atualizarProduto(produtoEditandoId, dados);
      await algoliaUpsert(produtoEditandoId, dados);
      mostrarMensagem(mensagemLista, "sucesso", `"${nome}" atualizado com sucesso.`);
    } else {
      const novoId = await criarProduto(dados);
      await algoliaUpsert(novoId, dados);
      mostrarMensagem(mensagemLista, "sucesso", `"${nome}" criado com sucesso. ID: ${novoId}`);
    }
    fecharModal();
    await carregarProdutos();
  } catch (e) {
    mostrarMensagem(mensagemModal, "erro", "Erro ao salvar: " + e.message);
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.textContent = "Salvar produto";
  }
});

// ── Editar produto ────────────────────────────────────────────────────────────
window.editarProduto = async (id) => {
  const produto = await buscarProdutoPorId(id);
  if (produto) abrirModal(produto);
};

// ── Desativar / Ativar ────────────────────────────────────────────────────────
window.confirmarDesativar = async (id, nome) => {
  const produto = produtos.find(p => p.id === id);
  const acao    = produto?.ativo ? "desativar" : "reativar";
  if (!confirm(`Tem certeza que deseja ${acao} "${nome}"?`)) return;
  try {
    const novoAtivo = !produto?.ativo;
    await atualizarProduto(id, { ativo: novoAtivo });
    if (!novoAtivo) {
      await algoliaDelete(id);
    } else {
      await algoliaUpsert(id, { ...produto, ativo: novoAtivo });
    }
    mostrarMensagem(mensagemLista, "sucesso", `"${nome}" ${acao === "desativar" ? "desativado" : "reativado"} com sucesso.`);
    await carregarProdutos();
  } catch (e) {
    mostrarMensagem(mensagemLista, "erro", "Erro: " + e.message);
  }
};

// ── Mensagens ─────────────────────────────────────────────────────────────────
function mostrarMensagem(el, tipo, texto) {
  el.textContent = texto;
  el.className   = `mensagem ${tipo}`;
  setTimeout(() => { el.className = "mensagem"; }, 6000);
}

// ── Algolia: botão de sincronização completa ──────────────────────────────────
// NOTA: este botão usa a Write Key diretamente por enquanto.
// TODO: migrar para endpoint serverless /api/algolia-sync conforme algolia.js
document.getElementById("btn-sync-algolia")?.addEventListener("click", async () => {
  const btn    = document.getElementById("btn-sync-algolia");
  const status = document.getElementById("algolia-sync-status");

  btn.disabled = true;
  btn.textContent = "⏳ Sincronizando...";
  status.style.color = "#c8a84e";
  status.textContent = "Buscando produtos...";

  try {
    const snap  = await (await import("https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js"))
      .getDocs((await import("https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js"))
      .collection((await import("https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js"))
      .getFirestore(app), "produtos"));

    const total = snap.size;
    if (!total) { status.textContent = "Nenhum produto encontrado."; return; }

    status.textContent = `Enviando ${total} produtos...`;

    function norm(id, data) {
      const obj = { objectID: id, ...data };
      if (obj.criadoEm?.toDate)     obj.criadoEm     = Math.floor(obj.criadoEm.toDate().getTime() / 1000);
      if (obj.atualizadoEm?.toDate) obj.atualizadoEm = Math.floor(obj.atualizadoEm.toDate().getTime() / 1000);
      return obj;
    }

    const todos = snap.docs.map(d => norm(d.id, d.data()));
    let feito = 0;

    for (let i = 0; i < todos.length; i += 50) {
      const lote = todos.slice(i, i + 50);
      const res  = await fetch(`https://AC7XL6FVL6.algolia.net/1/indexes/produtos/batch`, {
        method: "POST",
        headers: {
          "X-Algolia-Application-Id": "AC7XL6FVL6",
          "X-Algolia-API-Key":        "05dfe43bb394a10f7c1e934d342c22f4",
          "Content-Type":             "application/json",
        },
        body: JSON.stringify({ requests: lote.map(o => ({ action: "updateObject", body: o })) }),
      });
      if (!res.ok) throw new Error((await res.json()).message || `HTTP ${res.status}`);
      feito += lote.length;
      status.textContent = `${feito}/${total} enviados...`;
    }

    status.style.color = "#6ee7b7";
    status.textContent = `✓ ${total} produtos sincronizados!`;
    setTimeout(() => { status.textContent = ""; }, 5000);
  } catch (e) {
    status.style.color = "#f87171";
    status.textContent = "Erro: " + e.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "🔍 Sincronizar Algolia";
  }
});

// ── Auth — só deixa usar o admin se estiver logado E autorizado ───────────────
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

const auth = getAuth(app);

// ── Lista de e-mails autorizados ──────────────────────────────────────────────
// NOTA: esta lista está no cliente — não é 100% segura (pode ser vista no código-fonte).
// Para segurança real, migrar para Firebase Custom Claims:
// https://firebase.google.com/docs/auth/admin/custom-claims
// Enquanto isso, as Firestore Security Rules são a barreira real de segurança.
const ADMINS_AUTORIZADOS = [
  "rafaelmizob@gmail.com",
];

function ehAdmin(usuario) {
  return usuario && ADMINS_AUTORIZADOS.includes(usuario.email?.toLowerCase());
}

const telaLogin = document.getElementById("tela-login");
const loginErro  = document.getElementById("login-erro");

document.getElementById("btn-login-admin").addEventListener("click", async () => {
  const email = document.getElementById("login-email").value.trim();
  const senha = document.getElementById("login-senha").value;
  loginErro.textContent = "";
  if (!email || !senha) { loginErro.textContent = "Preencha e-mail e senha."; return; }
  try {
    const resultado = await signInWithEmailAndPassword(auth, email, senha);
    if (!ehAdmin(resultado.user)) {
      await signOut(auth);
      loginErro.textContent = "Acesso não autorizado.";
    }
  } catch {
    loginErro.textContent = "E-mail ou senha incorretos.";
  }
});

document.getElementById("btn-signout-admin").addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, (usuario) => {
  if (usuario && ehAdmin(usuario)) {
    telaLogin.style.display = "none";
    document.getElementById("info-usuario").textContent = usuario.email;
    carregarProdutos();
  } else {
    if (usuario && !ehAdmin(usuario)) signOut(auth);
    telaLogin.style.display = "flex";
  }
});