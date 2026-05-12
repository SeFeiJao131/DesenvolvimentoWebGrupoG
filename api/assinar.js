export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { email } = req.body;
  if (!email) return res.status(400).json({ erro: "Email inválido" });

  const resposta = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY
    },
    body: JSON.stringify({ email, listIds: [3], updateEnabled: true })
  });

  if (resposta.ok || resposta.status === 204) {
    res.status(200).json({ ok: true });
  } else {
    res.status(500).json({ erro: "Falha ao cadastrar" });
  }
}