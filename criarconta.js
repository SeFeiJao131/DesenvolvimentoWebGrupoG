import { app } from "./config.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  TwitterAuthProvider,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

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

// ── Botões sociais ────────────────────────────────────────────────────────────
document.getElementById("google-login")
  ?.addEventListener("click", () => loginComProvider(new GoogleAuthProvider()));

document.getElementById("github-login")
  ?.addEventListener("click", () => loginComProvider(new GithubAuthProvider()));

document.getElementById("twitter-login")
  ?.addEventListener("click", () => loginComProvider(new TwitterAuthProvider()));