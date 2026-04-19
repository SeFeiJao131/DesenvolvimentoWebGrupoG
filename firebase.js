import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCG5CTMCU5Tm__Jx7AdIPFzqoyyjHgleU0",
  authDomain: "joinrender-2ac79.firebaseapp.com",
  projectId: "joinrender-2ac79",
  storageBucket: "joinrender-2ac79.firebasestorage.app",
  messagingSenderId: "786464902095",
  appId: "1:786464902095:web:c896cfb7fe22aed92ea0ba"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.querySelector(".botao-entrar").addEventListener("click", async () => {
  const email = document.getElementById("input-email").value;
  const senha = document.getElementById("input-senha").value;

  if (!email || !senha) {
    alert("Preencha e-mail e senha.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, senha);
    window.location.href = "index.html";
  } catch (erro) {
    alert("E-mail ou senha incorretos.");
  }
});