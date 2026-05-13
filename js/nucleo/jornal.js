/* ═══════════════════════════════════════════════
   jornal.js — Assinatura de newsletter
   ═══════════════════════════════════════════════ */

// Suporta múltiplos footers na mesma página e páginas sem newsletter
document.querySelectorAll('[aria-label="Assinar newsletter"]').forEach(botao => {
  // Busca o input dentro do mesmo container (.campo-email) que o botão
  const campo = botao.closest(".campo-email")?.querySelector("input[type='email']")
             ?? document.getElementById("email-newsletter");

  if (!campo) return; // sem campo de e-mail, ignora

  botao.addEventListener("click", async () => {
    const email = campo.value.trim();
    if (!email || !email.includes("@")) {
      alert("Informe um e-mail válido.");
      return;
    }

    try {
      const resposta = await fetch("/api/assinar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (resposta.ok) {
        alert("Cadastrado com sucesso! ✅");
        campo.value = "";
      } else {
        throw new Error();
      }
    } catch {
      alert("Erro ao cadastrar. Tente novamente.");
    }
  });
});