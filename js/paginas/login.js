import { app } from "../nucleo/config.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  GithubAuthProvider,
  TwitterAuthProvider
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

const auth = getAuth(app);

// ── Auth state — atualiza o header ────────────────────────────────────────────
onAuthStateChanged(auth, (usuario) => {
  const acoesHeader = document.querySelector(".acoes-header");
  if (!acoesHeader) return;

  if (usuario) {
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

// ── Mostrar/ocultar senha — gerenciado pelo HTML, não duplicar aqui ───────────

// ── Login com e-mail/senha ────────────────────────────────────────────────────
document.querySelector(".botao-entrar")?.addEventListener("click", async () => {
  const email = document.getElementById("input-email").value.trim();
  const senha = document.getElementById("input-senha").value;

  if (!email || !senha) {
    alert("Preencha e-mail e senha.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, senha);
    window.location.href = "index.html";
  } catch {
    alert("E-mail ou senha incorretos.");
  }
});

// ── Helper para login social ──────────────────────────────────────────────────
async function loginComProvider(provider) {
  try {
    await signInWithPopup(auth, provider);
    window.location.href = "index.html";
  } catch (erro) {
    if (erro.code !== "auth/popup-closed-by-user") {
      alert("Erro ao entrar: " + erro.message);
    }
  }
}

// ── Botões sociais ────────────────────────────────────────────────────────────
document.getElementById("google-login")
  ?.addEventListener("click", () => loginComProvider(new GoogleAuthProvider()));

document.getElementById("github-login")
  ?.addEventListener("click", () => loginComProvider(new GithubAuthProvider()));

document.getElementById("twitter-login")
  ?.addEventListener("click", () => loginComProvider(new TwitterAuthProvider()));