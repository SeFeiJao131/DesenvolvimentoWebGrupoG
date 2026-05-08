import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";

export const firebaseConfig = {
  apiKey:            "AIzaSyCG5CTMCU5Tm__Jx7AdIPFzqoyyjHgleU0",
  authDomain:        "joinrender-2ac79.firebaseapp.com",
  projectId:         "joinrender-2ac79",
  storageBucket:     "joinrender-2ac79.firebasestorage.app",
  messagingSenderId: "786464902095",
  appId:             "1:786464902095:web:c896cfb7fe22aed92ea0ba"
};

export const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];