import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

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

onAuthStateChanged(auth, (usuario) => {
  const acoesHeader = document.querySelector(".acoes-header");
  if (!acoesHeader) return;

  if (usuario) {
    const nomeUsuario = usuario.email.split("@")[0];

    acoesHeader.innerHTML = `
      <span class="textobranco">${nomeUsuario}</span>
      <a class="loginbotao" id="botao-signout" href="#">Sign Out</a>
      <a class="textobranco" href="#">Sobre</a>
    `;

    document.getElementById("botao-signout").addEventListener("click", async (e) => {
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