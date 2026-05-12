import admin from "firebase-admin";

if (!admin.apps.length) {
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

const db = admin.firestore();

async function verificarAuth(req) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) throw { status: 401, mensagem: "Token ausente." };
  try {
    return await admin.auth().verifyIdToken(token);
  } catch {
    throw { status: 401, mensagem: "Token inválido." };
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")    return res.status(405).json({ mensagem: "Método não permitido." });

  try {
    const usuario = await verificarAuth(req);

    const s = await db.collection("compras")
      .where("usuarioId", "==", usuario.uid)
      .where("status",    "==", "aprovado")
      .orderBy("criadoEm", "desc")
      .get();

    const compras = s.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.status(200).json({ compras });

  } catch (e) {
    if (e.status) return res.status(e.status).json({ mensagem: e.mensagem });
    return res.status(500).json({ mensagem: e.message });
  }
}