import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCG5CTMCU5Tm__Jx7AdIPFzqoyyjHgleU0",
  authDomain: "joinrender-2ac79.firebaseapp.com",
  projectId: "joinrender-2ac79",
  storageBucket: "joinrender-2ac79.firebasestorage.app",
  messagingSenderId: "786464902095",
  appId: "1:786464902095:web:c896cfb7fe22aed92ea0ba"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

const inputSenha = document.getElementById("cc-senha");
const botaoOlho = document.getElementById("cc-botao-olho");

botaoOlho.addEventListener("click", () => {
  const visivel = inputSenha.type === "text";
  inputSenha.type = visivel ? "password" : "text";
  botaoOlho.textContent = visivel ? "👁" : "🙈";
});

document.getElementById("cc-botao-criar").addEventListener("click", async () => {
  const nome = document.getElementById("cc-nome").value.trim();
  const email = document.getElementById("cc-email").value.trim();
  const senha = inputSenha.value;
  const termos = document.getElementById("cc-check-termos").checked;
  const erro = document.getElementById("cc-erro");

  erro.textContent = "";

  if (!nome || !email || !senha) {
    erro.textContent = "Preencha todos os campos obrigatórios.";
    return;
  }
  if (senha.length < 8) {
    erro.textContent = "A senha deve ter pelo menos 8 caracteres.";
    return;
  }
  if (!termos) {
    erro.textContent = "Aceite os termos para continuar.";
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, senha);
    window.location.href = "index.html";
  } catch (e) {
    if (e.code === "auth/email-already-in-use") {
      erro.textContent = "Este e-mail já está cadastrado.";
    } else if (e.code === "auth/invalid-email") {
      erro.textContent = "E-mail inválido.";
    } else {
      erro.textContent = "Erro ao criar conta. Tente novamente.";
    }
  }
});