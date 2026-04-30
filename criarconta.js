import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  TwitterAuthProvider,
  updateProfile
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

// ── Mostrar/ocultar senha ─────────────────────────────────────────────────────
const inputSenha = document.getElementById("cc-senha");
const botaoOlho  = document.getElementById("cc-botao-olho");

if (botaoOlho) {
  botaoOlho.addEventListener("click", () => {
    const visivel = inputSenha.type === "text";
    inputSenha.type       = visivel ? "password" : "text";
    botaoOlho.textContent = visivel ? "👁" : "🙈";
  });
}

// ── Exibir erro ───────────────────────────────────────────────────────────────
function mostrarErro(msg) {
  const el = document.getElementById("cc-erro");
  if (el) el.textContent = msg;
}

// ── Criar conta com e-mail/senha ──────────────────────────────────────────────
document.getElementById("cc-botao-criar")?.addEventListener("click", async () => {
  mostrarErro("");

  const nome      = document.getElementById("cc-nome").value.trim();
  const sobrenome = document.getElementById("cc-sobrenome").value.trim();
  const email     = document.getElementById("cc-email").value.trim();
  const senha     = document.getElementById("cc-senha").value;
  const termos    = document.getElementById("cc-check-termos").checked;

  if (!nome || !email || !senha) {
    mostrarErro("Preencha todos os campos obrigatórios.");
    return;
  }
  if (senha.length < 8) {
    mostrarErro("A senha deve ter pelo menos 8 caracteres.");
    return;
  }
  if (!termos) {
    mostrarErro("Você precisa aceitar os Termos de Uso.");
    return;
  }

  try {
    const resultado = await createUserWithEmailAndPassword(auth, email, senha);
    await updateProfile(resultado.user, { displayName: `${nome} ${sobrenome}`.trim() });
    window.location.href = "index.html";
  } catch (erro) {
    if (erro.code === "auth/email-already-in-use") {
      mostrarErro("Este e-mail já está cadastrado.");
    } else if (erro.code === "auth/invalid-email") {
      mostrarErro("E-mail inválido.");
    } else {
      mostrarErro("Erro ao criar conta. Tente novamente.");
    }
  }
});

// ── Helper para login social ──────────────────────────────────────────────────
async function loginComProvider(provider) {
  try {
    await signInWithPopup(auth, provider);
    window.location.href = "index.html";
  } catch (erro) {
    if (erro.code !== "auth/popup-closed-by-user") {
      mostrarErro("Erro ao entrar: " + erro.message);
    }
  }
}

document.getElementById("twitter-login")
  ?.addEventListener("click", () => loginComProvider(new TwitterAuthProvider()));