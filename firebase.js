import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  GithubAuthProvider,
  TwitterAuthProvider
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCG5CTMCU5Tm__Jx7AdIPFzqoyyjHgleU0",
  authDomain: "joinrender-2ac79.firebaseapp.com",
  projectId: "joinrender-2ac79",
  storageBucket: "joinrender-2ac79.firebasestorage.app",
  messagingSenderId: "786464902095",
  appId: "1:786464902095:web:c896cfb7fe22aed92ea0ba"
};

const app  = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
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

// ── Mostrar/ocultar senha ─────────────────────────────────────────────────────
const inputSenha = document.getElementById("input-senha");
const botaoOlho  = document.getElementById("botao-olho");

if (botaoOlho && inputSenha) {
  botaoOlho.addEventListener("click", () => {
    const visivel = inputSenha.type === "text";
    inputSenha.type       = visivel ? "password" : "text";
    botaoOlho.textContent = visivel ? "👁" : "🙈";
  });
}

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