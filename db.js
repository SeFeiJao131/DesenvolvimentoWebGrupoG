import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  serverTimestamp,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// ── Inicialização ──────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyCG5CTMCU5Tm__Jx7AdIPFzqoyyjHgleU0",
  authDomain: "joinrender-2ac79.firebaseapp.com",
  projectId: "joinrender-2ac79",
  storageBucket: "joinrender-2ac79.firebasestorage.app",
  messagingSenderId: "786464902095",
  appId: "1:786464902095:web:c896cfb7fe22aed92ea0ba"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db  = getFirestore(app);
const auth = getAuth(app);

function docParaObjeto(snap) {
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
export function gerarSlug(nome) {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/**
 * @param {Object} opcoes
 * @param {string}  opcoes.tipo
 * @param {boolean} opcoes.gratuito
 * @param {boolean} opcoes.destaque
 * @param {number}  opcoes.limite
 * @returns {Promise<Array>}
 */
export async function buscarProdutos({ tipo, gratuito, destaque, limite = 50 } = {}) {
  const ref = collection(db, "produtos");
  const filtros = [where("ativo", "==", true)];

  if (tipo)       filtros.push(where("tipo", "==", tipo));
  if (gratuito !== undefined) filtros.push(where("gratuito", "==", gratuito));
  if (destaque)   filtros.push(where("destaque", "==", true));

  const q = query(ref, ...filtros, orderBy("criadoEm", "desc"), limit(limite));
  const snap = await getDocs(q);
  return snap.docs.map(docParaObjeto);
}

/**
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function buscarProdutoPorId(id) {
  const snap = await getDoc(doc(db, "produtos", id));
  return docParaObjeto(snap);
}

/**
 * @param {string} slug
 * @returns {Promise<Object|null>}
 */
export async function buscarProdutoPorSlug(slug) {
  const q = query(
    collection(db, "produtos"),
    where("slug", "==", slug),
    where("ativo", "==", true),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return docParaObjeto(snap.docs[0]);
}

/**
 * @param {string} tag
 * @returns {Promise<Array>}
 */
export async function buscarProdutosPorTag(tag) {
  const q = query(
    collection(db, "produtos"),
    where("tags", "array-contains", tag.toLowerCase()),
    where("ativo", "==", true),
    orderBy("criadoEm", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(docParaObjeto);
}

/**
 * @param {Object} dados
 * @returns {Promise<string>}
 */
export async function criarProduto(dados) {
  const novoProduto = {
    nome:        dados.nome,
    slug:        dados.slug || gerarSlug(dados.nome),
    tipo:        dados.tipo,
    descricao:   dados.descricao || "",
    preco:       dados.preco ?? 0,
    gratuito:    dados.preco === 0 || dados.preco == null,
    destaque:    dados.destaque ?? false,
    urlImagem:   dados.urlImagem || "",
    imagens:     dados.imagens || [],
    resolucao:   dados.resolucao || "",
    formato:     dados.formato || [],
    tamanhoMB:   dados.tamanhoMB || 0,
    suporte:     dados.suporte || [],
    render:      dados.render || [],
    categorias:  dados.categorias || [],
    tags:        (dados.tags || []).map(t => t.toLowerCase()),
    downloads:   0,
    ativo:       dados.ativo ?? true,
    criadoEm:    serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, "produtos"), novoProduto);
  return ref.id;
}

/**
 * @param {string} id
 * @param {Object} dados
 */
export async function atualizarProduto(id, dados) {
  if ("preco" in dados) {
    dados.gratuito = dados.preco === 0;
  }
  if (dados.tags) {
    dados.tags = dados.tags.map(t => t.toLowerCase());
  }
  await updateDoc(doc(db, "produtos", id), {
    ...dados,
    atualizadoEm: serverTimestamp(),
  });
}

/**
 * @param {string} id
 */
export async function desativarProduto(id) {
  await updateDoc(doc(db, "produtos", id), {
    ativo: false,
    atualizadoEm: serverTimestamp(),
  });
}

/**
 * @param {string} id
 */
export async function deletarProduto(id) {
  await deleteDoc(doc(db, "produtos", id));
}

/**
 * @param {string} produtoId
 * @returns {Promise<boolean>}
 */
export async function registrarDownload(produtoId) {
  const usuario = auth.currentUser;
  if (!usuario) return false;

  await addDoc(collection(db, "downloads"), {
    usuarioId:  usuario.uid,
    produtoId,
    criadoEm:   serverTimestamp(),
  });

  await updateDoc(doc(db, "produtos", produtoId), {
    downloads: increment(1),
  });

  return true;
}

/**
 * @param {string} produtoId
 * @returns {Promise<boolean>}
 */
export async function usuarioJaBaixou(produtoId) {
  const usuario = auth.currentUser;
  if (!usuario) return false;

  const q = query(
    collection(db, "downloads"),
    where("usuarioId", "==", usuario.uid),
    where("produtoId", "==", produtoId),
    limit(1)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}
/**
 * @param {string} uid
 * @param {Object} dados
 */
export async function salvarUsuario(uid, dados) {
  await updateDoc(doc(db, "usuarios", uid), {
    nome:        dados.nome || "",
    plano:       dados.plano || "free",
    criadoEm:    serverTimestamp(),
  }).catch(async () => {
    await addDoc(collection(db, "usuarios"), {
      uid,
      nome:      dados.nome || "",
      plano:     "free",
      downloads: [],
      criadoEm:  serverTimestamp(),
    });
  });
}

/**
 * @param {string} uid
 * @returns {Promise<Object|null>}
 */
export async function buscarUsuario(uid) {
  const snap = await getDoc(doc(db, "usuarios", uid));
  return docParaObjeto(snap);
}