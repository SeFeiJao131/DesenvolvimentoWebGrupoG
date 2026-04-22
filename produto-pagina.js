import { buscarProdutoPorId, registrarDownload, usuarioJaBaixou } from "./db.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyCG5CTMCU5Tm__Jx7AdIPFzqoyyjHgleU0",
  authDomain: "joinrender-2ac79.firebaseapp.com",
  projectId: "joinrender-2ac79",
  storageBucket: "joinrender-2ac79.firebasestorage.app",
  messagingSenderId: "786464902095",
  appId: "1:786464902095:web:c896cfb7fe22aed92ea0ba"
};
const app  = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

const params    = new URLSearchParams(window.location.search);
const produtoId = params.get("id");

if (!produtoId) {
  mostrarErro("Produto não encontrado.");
} else {
  carregarProduto();
}

async function carregarProduto() {
  try {
    const produto = await buscarProdutoPorId(produtoId);
    if (!produto || !produto.ativo) {
      mostrarErro("Produto não encontrado ou indisponível.");
      return;
    }
    preencherPagina(produto);
    iniciarViewer(produto);
    configurarAcao(produto);
  } catch (e) {
    mostrarErro("Erro ao carregar produto: " + e.message);
  }
}

function preencherPagina(produto) {
  document.title = `${produto.nome} — JoinRender`;

  const elNome = document.getElementById("nome-produto");
  if (elNome) elNome.textContent = produto.nome;

  const elDesc = document.getElementById("descricao-produto");
  if (elDesc) elDesc.textContent = produto.descricao || "Sem descrição disponível.";

  const elPreco = document.getElementById("preco-produto");
  if (elPreco) {
    elPreco.textContent = produto.gratuito
      ? "Gratuito"
      : `R$ ${Number(produto.preco).toFixed(2)}`;
  }

  setText("spec-resolucao", produto.resolucao || "—");
  setText("spec-formato",   (produto.formato  || []).join(", ") || "—");
  setText("spec-tamanho",   produto.tamanhoMB ? `${produto.tamanhoMB} MB` : "—");
  setText("spec-suporte",   (produto.suporte  || []).join(", ") || "—");
  setText("spec-render",    (produto.render   || []).join(", ") || "—");

  // Breadcrumb
  const tipoLabel = produto.tipo === "textura" ? "texturas"
                  : produto.tipo === "modelo"  ? "modelos 3D"
                  : "HDRIs";
  const tipoHref  = produto.tipo === "textura" ? "LayoutTexturas.html"
                  : produto.tipo === "modelo"  ? "LayoutModelos.html"
                  : "LayoutHdri.html";

  const breadcrumb = document.getElementById("breadcrumb");
  if (breadcrumb) {
    breadcrumb.innerHTML = `
      <a href="index.html">Home</a><span>/</span>
      <a href="${tipoHref}">${tipoLabel}</a><span>/</span>
      <span>${produto.nome}</span>
    `;
  }

  const badgeTipo = document.getElementById("badge-tipo");
  const badgeRes  = document.getElementById("badge-resolucao");
  if (badgeTipo) badgeTipo.textContent = tipoLabel.toUpperCase();
  if (badgeRes  && produto.resolucao) badgeRes.textContent = produto.resolucao;
}

function setText(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor;
}

function iniciarViewer(produto) {
  const loader   = document.getElementById("viewer-loader");
  const badges   = document.getElementById("viewer-badges");
  const controls = document.getElementById("viewer-controls");

  const url3d = produto.urlModelo || null;

  if (url3d && typeof THREE !== "undefined") {
    iniciarThreeJS(url3d, produto, loader, controls, badges);
  } else {
    // Fallback: mostra imagem de preview
    mostrarImagemViewer(produto, loader, badges);
  }
}

function iniciarThreeJS(url3d, produto, loader, controls, badges) {
  const canvas = document.getElementById("viewer-canvas");
  canvas.style.display = "block";

  const wrapper = canvas.parentElement;
  const W = wrapper.clientWidth;
  const H = wrapper.clientHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e0b0b);

  const camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 1000);
  camera.position.set(0, 1.2, 3);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xfff5e0, 1.2);
  dirLight1.position.set(5, 8, 5);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0xc8a96e, 0.4);
  dirLight2.position.set(-5, -2, -5);
  scene.add(dirLight2);

  const grid = new THREE.GridHelper(10, 20, 0x2a1f1f, 0x1a1212);
  grid.position.y = -0.01;
  scene.add(grid);

  let isDown = false, prevX = 0, prevY = 0;
  let rotX = 0, rotY = 0, zoom = 3;
  let autoRotate = false;
  let modelGroup = null;
  let wireframeMode = false;

  canvas.addEventListener("mousedown", e => { isDown = true; prevX = e.clientX; prevY = e.clientY; });
  canvas.addEventListener("mouseup",   () => { isDown = false; });
  canvas.addEventListener("mousemove", e => {
    if (!isDown || !modelGroup) return;
    const dx = e.clientX - prevX;
    const dy = e.clientY - prevY;
    rotY += dx * 0.008;
    rotX += dy * 0.008;
    rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotX));
    prevX = e.clientX;
    prevY = e.clientY;
  });
  canvas.addEventListener("wheel", e => {
    zoom = Math.max(0.5, Math.min(10, zoom + e.deltaY * 0.005));
  }, { passive: true });

  // Touch
  let lastTouchDist = 0;
  canvas.addEventListener("touchstart", e => {
    if (e.touches.length === 1) { isDown = true; prevX = e.touches[0].clientX; prevY = e.touches[0].clientY; }
    if (e.touches.length === 2) { lastTouchDist = getTouchDist(e); }
  });
  canvas.addEventListener("touchend", () => { isDown = false; });
  canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    if (e.touches.length === 1 && isDown && modelGroup) {
      const dx = e.touches[0].clientX - prevX;
      const dy = e.touches[0].clientY - prevY;
      rotY += dx * 0.008;
      rotX += dy * 0.008;
      prevX = e.touches[0].clientX;
      prevY = e.touches[0].clientY;
    }
    if (e.touches.length === 2) {
      const d = getTouchDist(e);
      zoom = Math.max(0.5, Math.min(10, zoom - (d - lastTouchDist) * 0.01));
      lastTouchDist = d;
    }
  }, { passive: false });

  function getTouchDist(e) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Controles UI
  if (controls) controls.style.display = "flex";

  document.getElementById("btn-reset-cam").onclick = () => {
    rotX = 0; rotY = 0; zoom = 3; autoRotate = false;
  };

  document.getElementById("btn-wireframe").onclick = () => {
    wireframeMode = !wireframeMode;
    if (modelGroup) {
      modelGroup.traverse(child => {
        if (child.isMesh) {
          child.material.wireframe = wireframeMode;
        }
      });
    }
  };

  const btnAuto = document.getElementById("btn-autorotate");
  btnAuto.onclick = () => {
    autoRotate = !autoRotate;
    btnAuto.style.color = autoRotate ? "var(--cor-dourado-vivo)" : "var(--cor-dourado-alt)";
  };

  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js";
  script.onload = () => {
    const gltfLoader = new THREE.GLTFLoader();
    gltfLoader.load(
      url3d,
      (gltf) => {
        modelGroup = gltf.scene;

        const box = new THREE.Box3().setFromObject(modelGroup);
        const center = box.getCenter(new THREE.Vector3());
        const size   = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale  = 2 / maxDim;

        modelGroup.position.sub(center.multiplyScalar(scale));
        modelGroup.scale.setScalar(scale);
        scene.add(modelGroup);

        const boxScaled = new THREE.Box3().setFromObject(modelGroup);
        grid.position.y = boxScaled.min.y;
        if (loader) { loader.classList.add("oculto"); }
        if (badges)  { badges.style.display = "flex"; }

        autoRotate = true;
        setTimeout(() => { autoRotate = false; }, 2000);
      },
      (xhr) => {
        if (loader) {
          const pct = Math.round((xhr.loaded / xhr.total) * 100);
          const txt = loader.querySelector(".loader-texto");
          if (txt) txt.textContent = `CARREGANDO ${pct}%`;
        }
      },
      (err) => {
        console.warn("[viewer] Falha ao carregar modelo 3D:", err);
        mostrarImagemViewer({ urlImagem: produto.urlImagem }, loader, badges);
        canvas.style.display = "none";
        if (controls) controls.style.display = "none";
      }
    );
  };
  script.onerror = () => {
    mostrarImagemViewer({ urlImagem: produto.urlImagem }, loader, badges);
    canvas.style.display = "none";
  };
  document.head.appendChild(script);

  function animate() {
    requestAnimationFrame(animate);
    if (modelGroup) {
      if (autoRotate) rotY += 0.008;
      modelGroup.rotation.y = rotY;
      modelGroup.rotation.x = rotX;
    }
    camera.position.set(
      Math.sin(rotY) * zoom * 0.3,
      0.5 + rotX * 0.5,
      zoom
    );
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener("resize", () => {
    const nW = wrapper.clientWidth;
    const nH = wrapper.clientHeight;
    camera.aspect = nW / nH;
    camera.updateProjectionMatrix();
    renderer.setSize(nW, nH);
  });
}

function mostrarImagemViewer(produto, loader, badges) {
  const img = document.getElementById("viewer-imagem");
  if (!img) return;

  img.style.display = "block";

  if (produto.urlImagem) {
    img.src = produto.urlImagem;
    img.alt = produto.nome || "Preview do asset";
    img.onload  = () => { if (loader) loader.classList.add("oculto"); if (badges) badges.style.display = "flex"; };
    img.onerror = () => { if (loader) loader.classList.add("oculto"); };
  } else {
    img.style.display = "none";
    const cvs = document.createElement("canvas");
    cvs.style.cssText = "width:100%;height:100%;display:block;";
    cvs.width  = 800;
    cvs.height = 675;
    const ctx = cvs.getContext("2d");
    const grad = ctx.createRadialGradient(400, 338, 0, 400, 338, 500);
    grad.addColorStop(0, "#1e1515");
    grad.addColorStop(1, "#0a0808");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 675);
    ctx.strokeStyle = "rgba(200,169,78,0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= 800; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 675); ctx.stroke(); }
    for (let y = 0; y <= 675; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y); ctx.stroke(); }
    ctx.fillStyle = "rgba(200,169,78,0.12)";
    ctx.font = "80px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("◈", 400, 338);

    img.parentElement.appendChild(cvs);
    if (loader) loader.classList.add("oculto");
    if (badges) badges.style.display = "flex";
  }
}

function configurarAcao(produto) {
  const areaAcao = document.getElementById("area-acao");
  if (!areaAcao) return;

  onAuthStateChanged(auth, async (usuario) => {
  
    if (!usuario) {
      areaAcao.innerHTML = `
        <button class="botao-download-pgProduto bloqueado" id="btn-acao">
          ${produto.gratuito ? "Login para baixar" : "Login para comprar"}
        </button>
      `;
      document.getElementById("btn-acao").onclick = () => {
        window.location.href = "login.html";
      };
      return;
    }

    if (!produto.gratuito) {
      areaAcao.innerHTML = `
        <button class="botao-download-pgProduto bloqueado" id="btn-acao">
          Comprar — R$ ${Number(produto.preco).toFixed(2)}
        </button>
        <p style="font-family:var(--font-mono);font-size:0.7rem;color:var(--cor-texto-escuro);text-align:center;margin-top:8px;">
          Sistema de pagamento em breve
        </p>
      `;
      document.getElementById("btn-acao").onclick = () => {
        alert("Sistema de pagamento em breve. Aguarde!");
      };
      return;
    }

    let jaBaixou = false;
    try {
      jaBaixou = await usuarioJaBaixou(produtoId);
    } catch (_) {}

    if (jaBaixou) {
      areaAcao.innerHTML = `
        <div class="badge-ja-baixado">✓ Já adicionado à sua biblioteca</div>
        <button class="botao-download-pgProduto sucesso" id="btn-acao" style="margin-top:6px;">
          Baixar novamente
        </button>
      `;
      document.getElementById("btn-acao").onclick = () => iniciarDownload(produto, true);
      return;
    }
    areaAcao.innerHTML = `
      <button class="botao-download-pgProduto" id="btn-acao">
        Download gratuito
      </button>
    `;
    document.getElementById("btn-acao").onclick = () => iniciarDownload(produto, false);
  });
}

async function iniciarDownload(produto, jaBaixou) {
  const btn = document.getElementById("btn-acao");
  if (!btn) return;

  btn.textContent = "Preparando…";
  btn.classList.add("carregando");

  try {
    if (!jaBaixou) {
      await registrarDownload(produtoId);
    }

    const urlArquivo = produto.urlArquivo || produto.urlModelo || null;

    if (urlArquivo) {
      const a = document.createElement("a");
      a.href     = urlArquivo;
      a.download = `${produto.nome || "asset"}.zip`;
      a.target   = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      btn.textContent = "✓ Download iniciado";
      btn.classList.remove("carregando");
      btn.classList.add("sucesso");
    } else {
      btn.textContent = "✓ Registrado na biblioteca";
      btn.classList.remove("carregando");
      btn.classList.add("sucesso");

      setTimeout(() => {
        btn.textContent = "Arquivo em breve";
        btn.classList.remove("sucesso");
      }, 3000);
    }
  } catch (e) {
    btn.textContent = "Erro — tente novamente";
    btn.classList.remove("carregando");
    btn.disabled = false;
    console.error("[download]", e);
  }
}


function mostrarErro(msg) {
  const nome = document.getElementById("nome-produto");
  const desc = document.getElementById("descricao-produto");
  const loader = document.getElementById("viewer-loader");

  if (nome) nome.textContent = "Produto não encontrado";
  if (desc) desc.textContent = msg;
  if (loader) loader.classList.add("oculto");

  const img = document.getElementById("viewer-imagem");
  if (img) {
    img.style.display = "none";
    const cvs = document.createElement("canvas");
    cvs.style.cssText = "width:100%;height:100%;display:block;";
    img.parentElement.appendChild(cvs);
  }
}