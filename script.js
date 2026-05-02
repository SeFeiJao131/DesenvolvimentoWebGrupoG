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

/* Carrossel */
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

/* Filtros */
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