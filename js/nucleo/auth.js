import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { app } from "./config.js";

const auth = getAuth(app);

// ── Detecta se estamos dentro da pasta /paginas/ ──────────────────────────────
// auth.js é usado tanto por index.html (raiz) quanto por páginas em /paginas/.
// O prefixo garante que os links funcionem corretamente nos dois contextos.
const emSubpasta = window.location.pathname.includes("/paginas/");
const prefixo    = emSubpasta ? "" : "paginas/";

onAuthStateChanged(auth, (usuario) => {
  const acoesHeader = document.querySelector(".acoes-header");
  if (!acoesHeader) return;

  if (usuario) {
    // Funciona com Google, GitHub, Twitter (que podem não ter email)
    const nome = usuario.displayName || usuario.email?.split("@")[0] || "Usuário";

    acoesHeader.innerHTML = `
      <a class="textobranco" href="${prefixo}perfil.html">${nome}</a>
      <a class="loginbotao" id="botao-signout" href="#">Sign Out</a>
      <a class="textobranco" href="${prefixo}sobre.html">Sobre</a>
    `;

    document.getElementById("botao-signout")?.addEventListener("click", async (e) => {
      e.preventDefault();
      await signOut(auth);
      window.location.reload();
    });

  } else {
    acoesHeader.innerHTML = `
      <a class="signupbotao" href="${prefixo}login.html">Login</a>
      <a class="loginbotao" href="${prefixo}Criarconta.html">Sign Up</a>
      <a class="textobranco" href="${prefixo}sobre.html">Sobre</a>
    `;
  }
});