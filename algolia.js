/* ═══════════════════════════════════════════════════════════════════════════
   algolia.js — Stub de sincronização Firestore → Algolia
   ═══════════════════════════════════════════════════════════════════════════

   CORREÇÃO DE SEGURANÇA CRÍTICA:
   A versão anterior expunha a Algolia Write (Admin) API Key diretamente no
   código do front-end. Qualquer pessoa com acesso ao repositório ou ao
   DevTools do browser poderia usar essa chave para deletar ou poluir todo
   o índice de busca.

   SOLUÇÃO CORRETA:
   A sincronização Firestore → Algolia deve ocorrer no SERVIDOR, não no browser.
   Opções recomendadas (escolha uma):

   1. Firebase Cloud Function (recomendado para projetos Firebase):
      - Trigger: onDocumentWritten("produtos/{id}", ...)
      - A função lê o documento e chama a API do Algolia com a Write Key
        armazenada em variável de ambiente (process.env.ALGOLIA_WRITE_KEY)
      - A Write Key nunca sai do servidor

   2. Webhook serverless (ex: Vercel Function em /api/algolia-sync.js):
      - Chamada pelo admin.js após criarProduto/atualizarProduto
      - A Vercel Function faz a requisição ao Algolia com a key de ambiente
      - Endpoint protegido por Bearer token ou secret compartilhado

   3. Algolia Dashboard → Connectors → Firebase (zero código):
      - Sincronização automática via integração oficial Algolia + Firebase

   ── O que fazer agora ────────────────────────────────────────────────────────
   Enquanto a solução de servidor não está implementada, este arquivo exporta
   stubs que logam um aviso e não fazem nada. O admin ainda funciona para
   gerenciar produtos no Firestore — apenas a sincronização com Algolia fica
   pausada até a migração ser feita.
   ═══════════════════════════════════════════════════════════════════════════ */

const ALGOLIA_APP_ID = "AC7XL6FVL6";
const ALGOLIA_INDEX  = "produtos";

// A Search-Only Key (somente leitura) é segura para o front-end
// e continua sendo usada em busca.js para autocomplete.
export const ALGOLIA_SEARCH_KEY = "d468aee7cc91ad6d128571bd8b782d2a";

/**
 * Stub: cria ou atualiza um objeto no índice Algolia.
 *
 * TODO: substituir pelo endpoint serverless /api/algolia-sync
 * que recebe { action: "upsert", id, dados } e executa no servidor
 * com a Write Key armazenada em variável de ambiente.
 *
 * @param {string} id    — ID do documento Firestore
 * @param {object} dados — dados do produto
 */
export async function algoliaUpsert(id, dados) {
  console.warn(
    "[algolia] algoliaUpsert() está desativado no front-end por segurança.\n" +
    `Produto "${dados?.nome}" (id: ${id}) NÃO foi sincronizado com o Algolia.\n` +
    "Implemente a sincronização via Cloud Function ou serverless endpoint."
  );
}

/**
 * Stub: remove um objeto do índice Algolia.
 *
 * TODO: substituir pelo endpoint serverless /api/algolia-sync
 * que recebe { action: "delete", id } e executa no servidor.
 *
 * @param {string} id — ID do documento Firestore
 */
export async function algoliaDelete(id) {
  console.warn(
    "[algolia] algoliaDelete() está desativado no front-end por segurança.\n" +
    `Objeto ${id} NÃO foi removido do Algolia.\n` +
    "Implemente a remoção via Cloud Function ou serverless endpoint."
  );
}