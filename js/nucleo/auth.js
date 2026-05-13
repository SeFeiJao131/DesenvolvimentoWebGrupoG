import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { app } from "./config.js";

const auth = getAuth(app);

onAuthStateChanged(auth, (usuario) => {
  const acoesHeader = document.querySelector(".acoes-header");
  if (!acoesHeader) return;

  if (usuario) {
    // Funciona com Google, GitHub, Twitter (que podem não ter email)
    const nome = usuario.displayName || usuario.email?.split("@")[0] || "Usuário";

    acoesHeader.innerHTML = `
      <span class="textobranco">${nome}</span>
      <a class="loginbotao" id="botao-signout" href="#">Sign Out</a>
      <a class="textobranco" href="#">Sobre</a>
    `;

    document.getElementById("botao-signout")?.addEventListener("click", async (e) => {
      e.preventDefault();
      await signOut(auth);
      window.location.reload();
    });

  } else {
    acoesHeader.innerHTML = `
      <a class="signupbotao" href="login.html">Login</a>
      <a class="loginbotao" href="Criarconta.html">Sign Up</a>
      <a class="textobranco" href="#">Sobre</a>
    `;
  }
});