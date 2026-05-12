const botao = document.querySelector('[aria-label="Assinar newsletter"]');
const campo = document.getElementById("email-newsletter");

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