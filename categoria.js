import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

// ── Firebase ───────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyCG5CTMCU5Tm__Jx7AdIPFzqoyyjHgleU0",
  authDomain: "joinrender-2ac79.firebaseapp.com",
  projectId: "joinrender-2ac79",
  storageBucket: "joinrender-2ac79.firebasestorage.app",
  messagingSenderId: "786464902095",
  appId: "1:786464902095:web:c896cfb7fe22aed92ea0ba"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db  = getFirestore(app);

// ── Metadados das categorias ───────────────────────────────────────────────────
// Usado para preencher título, descrição e breadcrumb de forma amigável.
// Chave: "<tipo>/<cat>" — deve bater com os parâmetros da URL.

const META = {
  // ── Texturas ──
  "textura/metais":    { titulo: "Metais",    desc: "Superfícies metálicas PBR de alta fidelidade — aço, ferro, cobre, ouro e muito mais.",         pai: { nome: "Texturas", href: "LayoutTexturas.html" } },
  "textura/madeiras":  { titulo: "Madeiras",  desc: "Madeiras procedurais com veios naturais e suporte completo a Cycles e EEVEE.",                  pai: { nome: "Texturas", href: "LayoutTexturas.html" } },
  "textura/pedras":    { titulo: "Pedras",    desc: "Pedras e rochas fotorrealistas mapeadas em PBR para renderização profissional.",                 pai: { nome: "Texturas", href: "LayoutTexturas.html" } },
  "textura/concreto":  { titulo: "Concreto",  desc: "Concreto, cimento e argamassa em alta resolução para projetos de arquitetura e visualização.", pai: { nome: "Texturas", href: "LayoutTexturas.html" } },
  "textura/tecidos":   { titulo: "Tecidos",   desc: "Tecidos e fibras com mapas de normal e rugosidade para renders detalhados.",                    pai: { nome: "Texturas", href: "LayoutTexturas.html" } },
  "textura/organicos": { titulo: "Vidros",    desc: "Vidros e materiais translúcidos com suporte a subsurface scattering e refração.",               pai: { nome: "Texturas", href: "LayoutTexturas.html" } },
  "textura/solo":      { titulo: "Mármore",   desc: "Mármores procedurais de alta fidelidade com veios naturais e mapeamento PBR completo.",         pai: { nome: "Texturas", href: "LayoutTexturas.html" } },

  // ── Modelos ──
  "modelo/mobiliario":  { titulo: "Banheiro",    desc: "Modelos 3D otimizados de ambientes de banheiro prontos para renderização em tempo real.",       pai: { nome: "Modelos 3D", href: "LayoutModelos.html" } },
  "modelo/cozinha":     { titulo: "Cozinha",     desc: "Modelos de cozinha e utensílios domésticos de alta fidelidade.",                              pai: { nome: "Modelos 3D", href: "LayoutModelos.html" } },
  "modelo/personagens": { titulo: "Personagens", desc: "Personagens 3D prontos para animação e jogos.",                                               pai: { nome: "Modelos 3D", href: "LayoutModelos.html" } },
  "modelo/veiculos":    { titulo: "Móveis",      desc: "Mobiliário moderno e clássico, otimizado para Blender, Unity e Unreal.",                       pai: { nome: "Modelos 3D", href: "LayoutModelos.html" } },
  "modelo/arquitetura": { titulo: "Tijolo",      desc: "Estruturas e elementos arquitetônicos em tijolo para visualização e jogos.",                   pai: { nome: "Modelos 3D", href: "LayoutModelos.html" } },
  "modelo/eletronicos": { titulo: "Eletrônicos", desc: "Eletrônicos e gadgets 3D com topologia limpa prontos para close-up renders.",                  pai: { nome: "Modelos 3D", href: "LayoutModelos.html" } },
  "modelo/portas":      { titulo: "Portas",      desc: "Portas e esquadrias detalhadas para projetos de arquitetura e visualização interior.",         pai: { nome: "Modelos 3D", href: "LayoutModelos.html" } },
  "modelo/natureza":    { titulo: "Natureza",    desc: "Elementos naturais 3D como plantas, rochas e árvores para cenas externas e jogos.",            pai: { nome: "Modelos 3D", href: "LayoutModelos.html" } },
  "modelo/comida":      { titulo: "Comida",      desc: "Modelos 3D de alimentos e pratos prontos para renders fotorrealistas.",                        pai: { nome: "Modelos 3D", href: "LayoutModelos.html" } },
  "modelo/objetos":     { titulo: "Objetos",     desc: "Objetos e props variados com topologia otimizada para jogos e renders.",                       pai: { nome: "Modelos 3D", href: "LayoutModelos.html" } },

  // ── HDRIs ──
  "hdri/exteriores": { titulo: "Ensolarado",     desc: "HDRIs de ambientes externos ensolarados para iluminação fotorrealista de alto contraste.",     pai: { nome: "HDRIs", href: "LayoutHdri.html" } },
  "hdri/interiores": { titulo: "Nublado",        desc: "Iluminações de céu nublado com luz difusa e uniforme, ideal para produtos e arquitetura.",     pai: { nome: "HDRIs", href: "LayoutHdri.html" } },
  "hdri/estudio":    { titulo: "Pôr-do-sol",     desc: "HDRIs de pôr-do-sol com tons quentes e dramáticos para cenas cinematográficas.",              pai: { nome: "HDRIs", href: "LayoutHdri.html" } },
  "hdri/ceu":        { titulo: "Noite",          desc: "HDRIs noturnos com céu estrelado para renders fotorrealistas e cenas de exterior à noite.",    pai: { nome: "HDRIs", href: "LayoutHdri.html" } },
  "hdri/noturno":    { titulo: "Nascer do sol",  desc: "Iluminações de nascer do sol com gradientes suaves entre azul e laranja para renders únicos.", pai: { nome: "HDRIs", href: "LayoutHdri.html" } },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatarData(timestamp) {
  if (!timestamp) return "";
  const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function criarCard(docSnap) {
  const p  = docSnap.data ? docSnap.data() : docSnap;
  const id = docSnap.id ?? docSnap.id;

  const imagemTag = p.urlImagem
    ? `<img src="${p.urlImagem}" alt="${p.nome}" loading="lazy">`
    : `<div style="width:100%;height:100%;background:#2a1f1f;"></div>`;

  const badgeNovo   = p.novo   ? `<span class="badge-novo-cat">Novo</span>`     : "";
  const badgeGratis = p.gratuito ? `<span class="badge-gratis-cat">Grátis</span>` : "";

  return `
    <a href="produto.html?id=${id}" class="card-categoria">
      ${imagemTag}
      ${badgeNovo}
      ${badgeGratis}
      <div class="card-categoria-info">
        <span class="card-categoria-nome">${p.nome || "Sem nome"}</span>
        <span class="card-categoria-tipo">${tipoLabel(p.tipo)}</span>
        <div class="card-categoria-meta">
          <span class="card-categoria-resolucao">${p.resolucao || ""}</span>
          <span class="card-categoria-data">${formatarData(p.criadoEm)}</span>
        </div>
      </div>
    </a>
  `;
}

function tipoLabel(tipo) {
  if (tipo === "modelo") return "Modelo 3D";
  if (tipo === "hdri")   return "HDRI";
  return "Textura";
}

function pluralItem(tipo, n) {
  if (tipo === "modelo") return `${n} modelo${n !== 1 ? "s" : ""} 3D`;
  if (tipo === "hdri")   return `${n} HDRI${n !== 1 ? "s" : ""}`;
  return `${n} textura${n !== 1 ? "s" : ""}`;
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function init() {
  const params = new URLSearchParams(window.location.search);
  const tipo   = (params.get("tipo") || "textura").toLowerCase();
  const cat    = (params.get("cat")  || "").toLowerCase();
  const chave  = `${tipo}/${cat}`;

  const meta = META[chave] ?? {
    titulo: cat.charAt(0).toUpperCase() + cat.slice(1),
    desc:   `Assets do tipo ${tipo} na categoria ${cat}.`,
    pai:    { nome: "Assets", href: "index.html" }
  };

  // ── Preenche cabeçalho ──
  document.title = `${meta.titulo} — JoinRender`;

  const elTitulo = document.querySelector(".categoria-titulo");
  const elDesc   = document.querySelector(".categoria-descricao");
  const elCont   = document.getElementById("contagem-produtos");
  const elCaminho = document.querySelector(".caminho-categoria");

  if (elTitulo)  elTitulo.textContent  = meta.titulo;
  if (elDesc)    elDesc.textContent    = meta.desc;
  if (elCont)    elCont.textContent    = "Carregando…";

  // Breadcrumb: Home / Texturas / Metais
  if (elCaminho) {
    elCaminho.innerHTML = `
      <a href="index.html">Home</a>
      <span>/</span>
      <a href="${meta.pai.href}">${meta.pai.nome}</a>
      <span>/</span>
      <span>${meta.titulo}</span>
    `;
  }

  // ── Busca no Firestore ──
  const grade = document.getElementById("grade-produtos");
  if (!grade) return;

  try {
    // Tenta primeiro pela campo "categorias" (array-contains)
    // Se não houver resultados, tenta pelo campo "categoria" (string simples)
    let docs = await buscarPorArrayCategoria(tipo, cat);

    if (docs.length === 0) {
      docs = await buscarPorCategoriaString(tipo, cat);
    }

    if (docs.length === 0) {
      if (elCont) elCont.textContent = "Nenhum asset encontrado nesta categoria.";
      grade.innerHTML = `<p style="color:var(--cor-texto-suave);padding:60px 0;grid-column:1/-1;text-align:center;">Nenhum asset encontrado.</p>`;
      return;
    }

    if (elCont) elCont.textContent = pluralItem(tipo, docs.length);
    grade.innerHTML = docs.map(criarCard).join("");

  } catch (e) {
    console.error("[categoria.js] Erro ao buscar produtos:", e);
    if (elCont) elCont.textContent = "";
    grade.innerHTML = `<p style="color:var(--cor-erro);padding:60px 0;grid-column:1/-1;">Erro ao carregar: ${e.message}</p>`;
  }
}

// Busca usando campo "categorias" (array) — padrão do db.js
async function buscarPorArrayCategoria(tipo, cat) {
  const q = query(
    collection(db, "produtos"),
    where("tipo",       "==",            tipo),
    where("categorias", "array-contains", cat),
    where("ativo",      "==",            true),
    orderBy("criadoEm", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs;
}

// Fallback: campo "categoria" como string simples (compatibilidade com script.js legado)
async function buscarPorCategoriaString(tipo, cat) {
  const q = query(
    collection(db, "produtos"),
    where("tipo",      "==", tipo),
    where("categoria", "==", cat),
    orderBy("criadoEm", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs;
}

init();