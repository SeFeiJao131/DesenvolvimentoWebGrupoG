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
(function() {
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

/* carrousel */
const trilha = document.getElementById('nov-carrossel-trilha');
const botaoAnterior = document.getElementById('nov-anterior');
const botaoProximo  = document.getElementById('nov-proximo');

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

/* ── FILTROS ── */
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

/*
 integrar com o bd
  {
    id:           1,
    tipo:         "textura" | "modelo" | "hdri",
    tipoRotulo:   "Textura" | "Modelo 3D" | "HDRI",
    nome:         "Mármore Carrara",
    descricao:    "Textura procedural...",
    url_imagem:   "https://...",
    data:         "2026-04-17",
    url:          "/produto/marmore-carrara",
    destaque:     true
  }

  function renderizarNovidades(dados) {
    const destaque = dados.find(item => item.destaque);
    const recentes = dados.filter(item => !item.destaque).slice(0, 8);
    const todos    = dados.filter(item => !item.destaque);

    if (destaque) {
      document.querySelector('.nov-destaque-etiqueta').textContent  = `NOVO · ${destaque.tipoRotulo.toUpperCase()}`;
      document.querySelector('.nov-destaque-nome').innerHTML        = destaque.nome;
      document.querySelector('.nov-destaque-descricao').innerHTML   = destaque.descricao;
      document.querySelector('.nov-destaque-botao').href            = destaque.url;
      document.querySelector('.nov-destaque-data').textContent      = `Lançado em ${formatarData(destaque.data)}`;
      document.querySelector('.nov-destaque-imagem').innerHTML      = `<img src="${destaque.url_imagem}" alt="${destaque.nome}">`;
    }

    if (trilha) {
      trilha.innerHTML = recentes.map(item => `
        <a class="nov-carrossel-cartao" href="${item.url}" data-id="${item.id}">
          <div class="nov-cartao-imagem">
            <img src="${item.url_imagem}" alt="${item.nome}">
          </div>
          <div class="nov-cartao-corpo">
            <span class="nov-cartao-rotulo">${item.tipoRotulo}</span>
            <span class="nov-cartao-nome">${item.nome}</span>
          </div>
        </a>
      `).join('');
    }

    const grade = document.getElementById('nov-grade');
    if (grade) {
      grade.innerHTML = todos.map(item => `
        <a class="nov-grade-cartao" href="${item.url}" data-id="${item.id}" data-tipo="${item.tipo}">
          <div class="nov-grade-imagem">
            <img src="${item.url_imagem}" alt="${item.nome}">
          </div>
          <div class="nov-grade-corpo">
            <span class="nov-cartao-rotulo">${item.tipoRotulo}</span>
            <span class="nov-cartao-nome">${item.nome}</span>
            <span class="nov-grade-data">${formatarData(item.data)}</span>
          </div>
        </a>
      `).join('');
    }
  }

  function formatarData(iso) {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  // fetch('/api/novidades')
  //   .then(resposta => resposta.json())
  //   .then(dados => renderizarNovidades(dados));
*/