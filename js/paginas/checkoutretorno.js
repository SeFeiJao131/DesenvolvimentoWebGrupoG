import { app } from "../nucleo/config.js";
import { getAuth, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

const API_BASE  = "/api";
const params    = new URLSearchParams(window.location.search);
const sessionId = params.get("session_id");
const produtoId = params.get("produto");
const cancelado = params.get("cancelado");

const auth = getAuth(app);

/* ── Helpers ──────────────────────────────────────────── */
const $ = id => document.getElementById(id);

function mostrar(id) {
  ["estado-verificando", "estado-sucesso", "estado-erro"]
    .forEach(s => {
      const el = $(s);
      if (el) el.classList.toggle("visivel", s === id);
    });
}

/* ── Fluxo principal ──────────────────────────────────── */

if (cancelado === "1" && produtoId) {
  location.href = `checkout.html?id=${produtoId}&cancelado=1`;

} else if (!sessionId) {
  mostrar("estado-erro");
  $("js-erro-msg").textContent = "Sessão de pagamento inválida ou expirada.";
  $("btn-tentar-novamente").href = produtoId
    ? `checkout.html?id=${produtoId}`
    : "../index.html";

} else {
  onAuthStateChanged(auth, async (usuario) => {
    if (!usuario) {
      location.href = `login.html?redirect=${encodeURIComponent(location.href)}`;
      return;
    }

    try {
      const token = await usuario.getIdToken();
      const res   = await fetch(
        `${API_BASE}/verificarsessao?session_id=${sessionId}`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.mensagem || `Erro ${res.status}`);

      if (data.pago) {
        mostrar("estado-sucesso");

        if (data.nomeProduto) {
          $("js-produto-box").style.display = "block";
          $("js-produto-nome").textContent  = data.nomeProduto;
          $("js-sucesso-msg").textContent   =
            `"${data.nomeProduto}" foi adicionado à sua conta.`;
        }

        /* Botão leva de volta para a página do produto */
        const btnBiblioteca = $("btn-biblioteca");
        if (btnBiblioteca && produtoId) {
          btnBiblioteca.onclick = () => {
            location.href = `produto.html?id=${produtoId}`;
          };
        }

        /* Download automático */
        if (data.urlArquivo) {
          setTimeout(() => {
            const a    = document.createElement("a");
            a.href     = data.urlArquivo;
            a.download = `${data.nomeProduto || "asset"}.zip`;
            a.target   = "_blank";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }, 1000);
        }

      } else {
        mostrar("estado-erro");
        $("js-erro-msg").textContent = "Pagamento não confirmado. Tente novamente.";
        $("btn-tentar-novamente").href = produtoId
          ? `checkout.html?id=${produtoId}`
          : "../index.html";
      }

    } catch (e) {
      mostrar("estado-erro");
      $("js-erro-msg").textContent =
        e.message || "Não foi possível verificar seu pagamento.";
      $("btn-tentar-novamente").href =
        produtoId ? `checkout.html?id=${produtoId}` : "../index.html";
    }
  });
}