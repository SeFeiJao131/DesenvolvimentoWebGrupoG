const barraPesquisa = document.querySelector(".barra-pesquisa input");
const overlay = document.querySelector(".overlay-busca");
const painel = document.querySelector(".painel-busca");

// Painel abre quando a pessoa clica na barra de pesquisa
barraPesquisa.addEventListener("focus", () => {
    overlay.classList.add("ativo");
});

// Painel fecha quando a pessoa clicar fora dele
overlay.addEventListener("click", (e) => {
    if (!painel.contains(e.target)) {
        overlay.classList.remove("ativo");
    }
});

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