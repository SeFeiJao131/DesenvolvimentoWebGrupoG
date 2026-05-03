/* ═══════════════════════════════════════════════════════════
   algolia.js — Sync Firestore → Algolia (sem Cloud Functions)
   Usado pelo admin.html para manter o índice sempre atualizado.
   ═══════════════════════════════════════════════════════════ */

const ALGOLIA_APP_ID   = "AC7XL6FVL6";
const ALGOLIA_WRITE_KEY = "69484ede99d6d05a2d582dd8aa08591b"; // ← cole aqui sua Write (Admin) API Key
const ALGOLIA_INDEX    = "produtos";

function cabecalhos() {
  return {
    "X-Algolia-Application-Id": ALGOLIA_APP_ID,
    "X-Algolia-API-Key":        ALGOLIA_WRITE_KEY,
    "Content-Type":             "application/json",
  };
}

/* Converte Timestamp Firestore → Unix seconds */
function normalizarDados(id, dados) {
  const obj = { objectID: id, ...dados };
  if (obj.criadoEm?.toDate)     obj.criadoEm     = Math.floor(obj.criadoEm.toDate().getTime() / 1000);
  if (obj.atualizadoEm?.toDate) obj.atualizadoEm = Math.floor(obj.atualizadoEm.toDate().getTime() / 1000);
  return obj;
}

/**
 * Cria ou atualiza um objeto no índice Algolia.
 * Chame após criarProduto() ou atualizarProduto() do Firestore.
 * @param {string} id   — ID do documento Firestore (vira objectID)
 * @param {object} dados — dados do produto
 */
export async function algoliaUpsert(id, dados) {
  if (ALGOLIA_WRITE_KEY === "69484ede99d6d05a2d582dd8aa08591b") {
    console.warn("Algolia: Write API Key não configurada.");
    return;
  }
  try {
    const obj = normalizarDados(id, dados);
    const url = `https://${ALGOLIA_APP_ID}.algolia.net/1/indexes/${ALGOLIA_INDEX}/${id}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: cabecalhos(),
      body: JSON.stringify(obj),
    });
    if (!res.ok) throw new Error((await res.json()).message);
    console.log(`Algolia: ✓ "${dados.nome}" sincronizado.`);
  } catch (e) {
    console.error("Algolia upsert erro:", e.message);
  }
}

/**
 * Remove um objeto do índice Algolia.
 * Chame após deletar/desativar um produto.
 * @param {string} id — ID do documento Firestore
 */
export async function algoliaDelete(id) {
  if (ALGOLIA_WRITE_KEY === "69484ede99d6d05a2d582dd8aa08591b") {
    console.warn("Algolia: Write API Key não configurada.");
    return;
  }
  try {
    const url = `https://${ALGOLIA_APP_ID}.algolia.net/1/indexes/${ALGOLIA_INDEX}/${id}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: cabecalhos(),
    });
    if (!res.ok) throw new Error((await res.json()).message);
    console.log(`Algolia: ✓ objeto ${id} removido.`);
  } catch (e) {
    console.error("Algolia delete erro:", e.message);
  }
}