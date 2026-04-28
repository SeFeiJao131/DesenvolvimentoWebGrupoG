import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

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

// 🔐 Providers sociais
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const twitterProvider = new TwitterAuthProvider();

// 👁 Mostrar/ocultar senha
const inputSenha = document.getElementById("cc-senha");
const botaoOlho = document.getElementById("cc-botao-olho");

botaoOlho.addEventListener("click", () => {
  const visivel = inputSenha.type === "text";
  inputSenha.type = visivel ? "password" : "text";
  botaoOlho.textContent = visivel ? "👁" : "🙈";
});

// 📧 Criar conta com email
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

// 🔵 Login com Google
document.getElementById("google-login")?.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Google:", result.user);
    window.location.href = "index.html";
  } catch (e) {
    console.error(e);
    alert("Erro ao entrar com Google");
  }
});

// 🔵 Login com Facebook
document.getElementById("facebook-login")?.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    console.log("Facebook:", result.user);
    window.location.href = "index.html";
  } catch (e) {
    console.error(e);
    alert("Erro ao entrar com Facebook");
  }
});

// 🔵 Login com X (Twitter)
document.getElementById("twitter-login")?.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, twitterProvider);
    console.log("X:", result.user);
    window.location.href = "index.html";
  } catch (e) {
    console.error(e);
    alert("Erro ao entrar com X");
  }
});
