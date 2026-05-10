/* nav-mobile.js — Hamburger drawer para todas as páginas */
(function () {
  const btnOpen   = document.getElementById('btn-hamburger');
  const btnClose  = document.getElementById('btn-fechar-drawer');
  const drawer    = document.getElementById('nav-drawer');
  const overlay   = document.getElementById('nav-overlay');

  if (!btnOpen || !drawer) return;

  function abrirDrawer() {
    drawer.classList.add('aberto');
    overlay.classList.add('ativo');
    btnOpen.setAttribute('aria-expanded', 'true');
    overlay.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    btnClose && btnClose.focus();
  }

  function fecharDrawer() {
    drawer.classList.remove('aberto');
    overlay.classList.remove('ativo');
    btnOpen.setAttribute('aria-expanded', 'false');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    btnOpen.focus();
  }

  btnOpen.addEventListener('click', abrirDrawer);
  btnClose && btnClose.addEventListener('click', fecharDrawer);
  overlay.addEventListener('click', fecharDrawer);

  // Fechar com ESC
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('aberto')) {
      fecharDrawer();
    }
  });

  // Scroll: adiciona classe ao header para borda sutil
  const header = document.getElementById('site-header');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  }
})();