/* ─────────────────────────────────────────────────────────────────────────────
   script.js — Utilitários globais da página
   CORREÇÃO: bloco "Drawer de navegação mobile" REMOVIDO daqui.
   O drawer é gerenciado exclusivamente por nav-mobile.js, que é carregado
   em todas as páginas. Manter aqui causava double event listeners em
   index.html (onde ambos os scripts eram carregados), fazendo o drawer
   fechar imediatamente após abrir.
   ───────────────────────────────────────────────────────────────────────────── */

/* ── Painel de busca ─────────────────────────────────────────────────────────
   Abre o overlay de busca ao focar no input da navbar.
   (A lógica completa de autocomplete fica em busca.js)
   ─────────────────────────────────────────────────────────────────────────── */
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

/* ── Data dinâmica na home ───────────────────────────────────────────────────
   Preenche o badge "#dataHoje" na seção hero da index.html
   ─────────────────────────────────────────────────────────────────────────── */
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

/* ── Carrossel de novidades ──────────────────────────────────────────────────
   Usado na página Novidade.html
   ─────────────────────────────────────────────────────────────────────────── */
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

/* ── Filtros de categoria na grade de novidades ──────────────────────────────
   Usado na página Novidade.html — filtra cards por tipo (textura/modelo/hdri)
   ─────────────────────────────────────────────────────────────────────────── */
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