# DesenvolvimentoWebGrupoG

# JoinRender — Plataforma de Assets 3D Profissionais

> Modelos 3D, texturas PBR e HDRIs de alta qualidade para artistas e desenvolvedores.

---

## Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Páginas](#páginas)
- [Arquitetura Front-end](#arquitetura-front-end)
- [Back-end & API](#back-end--api)
- [Banco de Dados (Firestore)](#banco-de-dados-firestore)
- [Autenticação](#autenticação)
- [Busca com Algolia](#busca-com-algolia)
- [Painel Administrativo](#painel-administrativo)
- [Integração de Pagamentos (Stripe)](#integração-de-pagamentos-stripe)
- [Newsletter (Brevo)](#newsletter-brevo)
- [CSS — Sistema de Design](#css--sistema-de-design)
- [Acessibilidade](#acessibilidade)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Instalação e Execução](#instalação-e-execução)
- [Deploy no Vercel](#deploy-no-vercel)
- [Como Contribuir](#como-contribuir)
- [Autores](#autores)
- [Licença](#licença)

---

## Sobre o Projeto

**JoinRender** é uma plataforma web de marketplace de assets 3D que disponibiliza texturas PBR, modelos 3D e HDRIs para profissionais de renderização, desenvolvedores de jogos e artistas digitais. O site oferece tanto assets gratuitos quanto pagos, com download direto após autenticação.

O projeto foi desenvolvido como trabalho universitário pelo **Grupo G**, com foco em boas práticas de desenvolvimento web, separação de responsabilidades, acessibilidade e integração com serviços externos como Firebase, Algolia e Stripe.

---

## Funcionalidades

### Para Visitantes
- Navegar pelo catálogo de texturas, modelos 3D e HDRIs
- Pesquisa com autocomplete integrada ao Algolia
- Filtrar assets por categoria, tipo e resolução
- Visualizar página de detalhes de cada produto com especificações técnicas
- Cadastro e login com e-mail/senha ou provedores sociais (Google, GitHub, Twitter)
- Páginas institucionais: Sobre, Contato, Termos de Uso e Política de Privacidade

### Para Usuários Autenticados
- Download de assets gratuitos com registro automático no histórico
- Verificação de downloads anteriores (evita duplicatas)
- Checkout para compra de assets pagos via Stripe (Cartão de Crédito e PIX)
- Histórico de compras acessível via API

### Para Administradores
- Painel de administração protegido para gerenciamento completo do catálogo
- Criar, editar, desativar e excluir produtos
- Upload de imagens e arquivos diretamente para o Firebase Storage
- Visualização de estatísticas: total de produtos por tipo e downloads
- Busca e filtragem de produtos no painel

---

## Tecnologias Utilizadas

### Front-end
| Tecnologia | Uso |
|---|---|
| HTML5 | Estrutura semântica de todas as páginas |
| CSS3 (modular) | Estilização com variáveis CSS e sistema de design próprio |
| JavaScript (ES Modules) | Lógica de cada página e componentes interativos |
| Firebase JS SDK v12 | Autenticação, Firestore e Storage no lado cliente |
| Algolia Search | Autocomplete e busca em tempo real |
| Flaticon Uicons | Biblioteca de ícones SVG via CDN |
| Google Fonts | Playfair Display, DM Sans, Roboto Serif, Recursive |

### Back-end (API Serverless — Vercel)
| Tecnologia | Uso |
|---|---|
| Node.js | Runtime das funções serverless |
| Express.js | Servidor para desenvolvimento local |
| Firebase Admin SDK | Acesso ao Firestore e Auth no servidor |
| Stripe SDK | Integração de pagamentos (Checkout, PIX, Webhooks) |
| Brevo (Sendinblue) | Cadastro de leads na newsletter |
| dotenv | Gerenciamento de variáveis de ambiente |
| nodemon | Hot-reload em desenvolvimento |

### Infraestrutura
| Serviço | Uso |
|---|---|
| Firebase Firestore | Banco de dados NoSQL principal |
| Firebase Authentication | Autenticação de usuários |
| Firebase Storage | Armazenamento de imagens e arquivos dos assets |
| Algolia | Motor de busca e autocomplete |
| Stripe | Processamento de pagamentos (cartão e PIX) |
| Brevo | Plataforma de e-mail marketing e newsletter |
| Vercel | Deploy das funções serverless da API |

---

## Estrutura do Projeto

```
DesenvolvimentoWebGrupoG-main/
│
├── index.html                  # Página inicial (Home)
├── package.json                # Dependências Node.js da API
│
├── paginas/
│   ├── login.html              # Página de login
│   ├── Criarconta.html         # Página de criação de conta
│   ├── produto.html            # Página de produto individual
│   ├── paginacategoria.html    # Página de categoria com grid de produtos
│   ├── LayoutTexturas.html     # Layout do catálogo de Texturas
│   ├── LayoutModelos.html      # Layout do catálogo de Modelos 3D
│   ├── LayoutHdri.html         # Layout do catálogo de HDRIs
│   ├── Novidade.html           # Página de Novidades
│   ├── ResultadoBusca.html     # Página de resultados de busca
│   ├── checkout.html           # Página de checkout
│   ├── checkoutretorno.html    # Retorno após pagamento
│   ├── admin.html              # Painel administrativo
│   ├── contato.html            # Página de contato
│   ├── sobre.html              # Página institucional Sobre
│   ├── privacidade.html        # Política de privacidade
│   ├── termos.html             # Termos de uso
│   └── licenca.html            # Licenças de terceiros
│
├── css/
│   ├── main.css                # Ponto de entrada do CSS (importa todos os módulos)
│   ├── fonts.css               # Importação das fontes do Google Fonts
│   ├── base/
│   │   ├── variav.css          # Variáveis CSS (cores, tipografia, espaçamentos)
│   │   └── reset.css           # Reset de estilos globais
│   ├── componentes/
│   │   ├── navbar.css          # Estilos do cabeçalho e navegação
│   │   ├── busca.css           # Estilos do painel de busca e overlay
│   │   ├── cards.css           # Estilos dos cards de produto
│   │   ├── novidades.css       # Estilos dos componentes de novidades
│   │   └── footer.css          # Estilos do rodapé
│   └── paginas/
│       ├── home.css            # Estilos exclusivos da Home
│       ├── produto.css         # Estilos da página de produto
│       ├── layouts.css         # Estilos dos layouts de catálogo
│       ├── categoria.css       # Estilos da página de categoria
│       ├── criarconta.css      # Estilos do formulário de criação de conta
│       ├── login.css           # Estilos da página de login
│       ├── resultadobusca.css  # Estilos da página de busca
│       ├── institucional.css   # Estilos das páginas institucionais
│       ├── checkout.css        # Estilos do checkout
│       └── checkoutretorno.css # Estilos do retorno de pagamento
│
├── js/
│   ├── nucleo/
│   │   ├── config.js           # Configuração e inicialização do Firebase
│   │   ├── db.js               # Camada de acesso ao Firestore (CRUD)
│   │   ├── auth.js             # Gerenciamento de estado de autenticação global
│   │   ├── script.js           # Utilitários globais (busca, carrossel, filtros)
│   │   ├── busca.js            # Painel de busca com autocomplete Algolia
│   │   ├── algolia.js          # Stubs de sincronização Firestore → Algolia
│   │   ├── nav-mobile.js       # Drawer de navegação mobile (hamburger)
│   │   └── jornal.js           # Lógica de inscrição na newsletter (Brevo)
│   ├── main/
│   │   ├── main-busca.js       # Entry point da página de busca
│   │   ├── main-categoria.js   # Entry point da página de categoria
│   │   ├── main-institucional.js # Entry point das páginas institucionais
│   │   ├── main-layouts.js     # Entry point dos layouts de catálogo
│   │   └── main-novidade.js    # Entry point da página de novidades
│   └── paginas/
│       ├── admin.js            # Lógica completa do painel administrativo
│       ├── login.js            # Lógica de login (e-mail, social)
│       ├── criarconta.js       # Lógica de criação de conta
│       ├── produto-pagina.js   # Lógica da página de produto individual
│       ├── novidade.js         # Carregamento dinâmico da página de novidades
│       ├── categoria.js        # Carregamento dinâmico por categoria
│       ├── resultadobusca.js   # Lógica da página de resultados de busca
│       ├── checkout.js         # Lógica de checkout (Stripe)
│       └── checkoutretorno.js  # Lógica de retorno do pagamento
│
├── api/
│   ├── produtos.js             # GET /api/produtos — listagem pública de produtos
│   ├── produtos/[id].js        # GET /api/produtos/:id — produto individual
│   ├── stats.js                # GET /api/stats — estatísticas do catálogo
│   ├── verificarsessao.js      # GET /api/verificarsessao — valida sessão de pagamento
│   ├── pagamento.js            # Servidor Express local para desenvolvimento
│   ├── assinar.js              # POST /api/assinar — inscrição na newsletter (Brevo)
│   ├── criarcheckoutsessao.js  # POST — cria sessão Stripe Checkout
│   ├── criarpagamento.js       # POST — cria intenção de pagamento (cartão)
│   ├── criarpix.js             # POST — gera pagamento via PIX
│   ├── minhascompras.js        # GET — histórico de compras do usuário
│   ├── verificarpix.js         # GET — verifica status do PIX
│   └── webhookstripe.js        # POST — webhook de eventos Stripe
│
└── assets/
    ├── imagens/                # Assets visuais das páginas (WebP)
    └── fontes/                 # Fontes personalizadas (jsMath-cmbx10.ttf)
```

---

## Páginas

### `index.html` — Home
Página inicial da plataforma. Apresenta:
- **Hero de Novidades** com badge de data dinâmica (gerada em JavaScript)
- **Cards de destaque** com pré-visualizações dos assets mais recentes
- **Seção de Modelos 3D** com cards de produtos em destaque
- **Seção de Texturas Procedurais** com galeria visual interativa
- **Manifesto** da marca JoinRender
- Navegação completa com barra de busca com autocomplete

### `LayoutTexturas.html` / `LayoutModelos.html` / `LayoutHdri.html` — Catálogos
Páginas de listagem por tipo de asset. Exibem um grid de cards carregados dinamicamente do Firestore, com opção de navegação por categorias.

### `paginacategoria.html` — Página de Categoria
Exibe todos os produtos de uma categoria específica (ex: Madeiras, Metais, HDRIs Noturnos). O tipo e a categoria são passados via parâmetros na URL e os produtos são buscados dinamicamente do Firestore. Inclui breadcrumb de navegação e descrição da categoria.

### `produto.html` — Página de Produto
Página individual de um asset com:
- Imagem principal e galeria
- Especificações técnicas: resolução, formato, tamanho, motores de render suportados
- Preço (ou indicação de gratuito)
- Botão de download (para assets gratuitos) ou de compra
- Breadcrumb dinâmico
- Atualização da `<meta name="description">` em tempo real para SEO

### `Novidade.html` — Novidades
Página dinâmica com:
- **Destaque principal**: o produto mais recente com `destaque: true`
- **Carrossel**: os 8 assets mais recentes
- **Grade filtrável**: todos os assets adicionados nos últimos 7 dias, filtráveis por tipo (Textura / Modelo / HDRI)

### `ResultadoBusca.html` — Resultado de Busca
Exibe os resultados de uma busca por texto realizada via Algolia, com cards dos produtos encontrados.

### `login.html` — Login
Formulário de autenticação com:
- Login por e-mail e senha
- Login social via Google, GitHub e Twitter (OAuth popup)
- Toggle de visibilidade da senha

### `Criarconta.html` — Criar Conta
Formulário de registro com:
- Nome, sobrenome, e-mail e senha
- Validação de campos obrigatórios e comprimento mínimo de senha (8 caracteres)
- Aceite obrigatório dos Termos de Uso
- Registro social via Google, GitHub e Twitter

### `checkout.html` — Checkout
Página de pagamento para assets pagos, com suporte a:
- **Cartão de crédito** via Stripe Elements (modo `checkout`)
- **PIX** com geração de QR Code e polling de status

### `checkoutretorno.html` — Retorno de Pagamento
Página de confirmação exibida após o redirecionamento do Stripe, que valida a sessão via `/api/verificarsessao` e registra a compra no Firestore.

### `admin.html` — Painel Administrativo
Interface administrativa (acesso restrito) para:
- Visualização de estatísticas gerais do catálogo
- Listagem, busca e filtragem de produtos
- Criação e edição de produtos via modal
- Upload de imagem de capa, arquivo do asset e modelo 3D para o Firebase Storage
- Desativação e exclusão de produtos

### Páginas Institucionais
- **`sobre.html`** — Apresentação da empresa e missão
- **`contato.html`** — Formulário e informações de contato
- **`privacidade.html`** — Política de privacidade
- **`termos.html`** — Termos de uso da plataforma
- **`licenca.html`** — Créditos e licenças de recursos de terceiros utilizados

---

## Arquitetura Front-end

O front-end é construído em **HTML, CSS e JavaScript puros**, sem frameworks. Cada página carrega apenas os scripts necessários para seu funcionamento. A comunicação com o Firebase é feita diretamente no browser via **Firebase JS SDK v12** com ES Modules.

### Módulos JavaScript principais

| Arquivo | Responsabilidade |
|---|---|
| `config.js` | Inicializa o app Firebase (singleton com `getApps()`) |
| `db.js` | Camada de abstração do Firestore: CRUD de produtos, usuários e downloads |
| `auth.js` | Observa `onAuthStateChanged` e atualiza o header dinamicamente em todas as páginas |
| `script.js` | Painel de busca, data dinâmica no hero, carrossel e filtros de novidades |
| `busca.js` | Autocomplete com Algolia: painel inicial de sugestões e busca em tempo real |
| `nav-mobile.js` | Drawer de navegação mobile com suporte a teclado (ESC para fechar) e ARIA |
| `algolia.js` | Stubs de sincronização client-side → Algolia (desativados por segurança) |
| `jornal.js` | Integração com Brevo para inscrição de e-mails na newsletter via `/api/assinar` |

---

## Back-end & API

As rotas serverless ficam na pasta `/api` e são compatíveis com o **Vercel Serverless Functions** (formato `module.exports = async function handler(req, res)`).

Para desenvolvimento local, o arquivo `api/pagamento.js` expõe todas as rotas via Express.js, permitindo testar sem deploy.

### Endpoints disponíveis

#### `GET /api/produtos`
Lista os produtos ativos do catálogo.

**Parâmetros de query:**
| Parâmetro | Tipo | Descrição |
|---|---|---|
| `tipo` | `string` | Filtra por tipo: `textura`, `modelo` ou `hdri` |
| `gratuito` | `boolean` | Filtra assets gratuitos (`true`) ou pagos (`false`) |
| `destaque` | `boolean` | Retorna apenas produtos em destaque |
| `limite` | `number` | Número máximo de resultados (padrão: 24, máximo: 100) |

**Resposta:**
```json
{
  "total": 12,
  "limite": 24,
  "filtros": { "tipo": "textura", "gratuito": null, "destaque": null },
  "produtos": [ { "id": "...", "nome": "...", "tipo": "textura", ... } ]
}
```

#### `GET /api/produtos/:id`
Retorna os dados completos de um produto pelo seu ID.

#### `GET /api/stats`
Retorna estatísticas gerais do catálogo.

**Resposta:**
```json
{
  "totalProdutos": 45,
  "totalTexturas": 20,
  "totalModelos": 15,
  "totalHdris": 10,
  "totalGratuitos": 30,
  "totalDownloads": 1234,
  "atualizadoEm": "2026-05-12T00:00:00.000Z"
}
```

**Cache:** 30 minutos no Vercel Edge + revalidação em background.

#### `GET /api/verificarsessao`
Valida uma sessão de pagamento Stripe e registra a compra no Firestore.
Requer header `Authorization: Bearer <firebase-id-token>`.

#### `POST /api/assinar`
Cadastra um e-mail na lista de newsletter via **Brevo** (lista de ID `3`).

**Body:**
```json
{ "email": "usuario@exemplo.com" }
```

#### `POST /api/criarcheckoutsessao`
Cria uma sessão Stripe Checkout para redirecionamento ao checkout hospedado.
Requer autenticação via `Authorization: Bearer <firebase-id-token>`.

#### `POST /api/criarpagamento`
Cria um PaymentIntent Stripe para pagamento com cartão de crédito via Stripe Elements.
Requer autenticação.

#### `POST /api/criarpix`
Gera um PaymentIntent Stripe com método PIX e retorna os dados do QR Code.
Requer autenticação.

#### `GET /api/verificarpix`
Verifica o status de um PaymentIntent PIX via polling.
Requer autenticação.

#### `GET /api/minhascompras`
Retorna o histórico de compras do usuário autenticado, consultando a coleção `compras` no Firestore.
Requer autenticação.

#### `POST /api/webhookstripe`
Recebe e processa eventos do Stripe (ex: `checkout.session.completed`, `payment_intent.succeeded`) para confirmar compras no Firestore.
Valida a assinatura do webhook via `STRIPE_WEBHOOK_SECRET`.

---

## Banco de Dados (Firestore)

### Coleção `produtos`

| Campo | Tipo | Descrição |
|---|---|---|
| `nome` | `string` | Nome do produto |
| `slug` | `string` | Identificador amigável para URLs |
| `tipo` | `string` | `textura`, `modelo` ou `hdri` |
| `descricao` | `string` | Descrição detalhada do asset |
| `preco` | `number` | Preço em reais (0 para gratuitos) |
| `gratuito` | `boolean` | Derivado do preço automaticamente |
| `destaque` | `boolean` | Aparece na seção de destaques |
| `urlImagem` | `string` | URL da imagem de capa no Firebase Storage |
| `imagens` | `array<string>` | URLs de imagens adicionais |
| `resolucao` | `string` | Ex: `4K`, `8K` |
| `formato` | `array<string>` | Ex: `["PNG", "EXR", "FBX"]` |
| `tamanhoMB` | `number` | Tamanho do arquivo em MB |
| `suporte` | `array<string>` | Softwares suportados (ex: Blender, Unreal) |
| `render` | `array<string>` | Motores de render compatíveis (ex: Cycles, EEVEE) |
| `categorias` | `array<string>` | Categorias do produto |
| `tags` | `array<string>` | Tags para busca (sempre em minúsculas) |
| `downloads` | `number` | Contador de downloads/compras |
| `ativo` | `boolean` | Controla visibilidade no catálogo |
| `criadoEm` | `Timestamp` | Data de criação |
| `atualizadoEm` | `Timestamp` | Data da última atualização |

### Coleção `usuarios`

| Campo | Tipo | Descrição |
|---|---|---|
| `uid` | `string` | UID do Firebase Auth (usado como ID do documento) |
| `nome` | `string` | Nome de exibição |
| `plano` | `string` | Plano do usuário (`free` por padrão) |
| `downloads` | `array` | Histórico de downloads |
| `criadoEm` | `Timestamp` | Data de criação |

### Coleção `downloads`

Registra cada download realizado por um usuário autenticado.

| Campo | Tipo | Descrição |
|---|---|---|
| `usuarioId` | `string` | UID do usuário |
| `produtoId` | `string` | ID do produto baixado |
| `criadoEm` | `Timestamp` | Data do download |

### Coleção `compras`

Registra compras confirmadas após pagamento via Stripe.

| Campo | Tipo | Descrição |
|---|---|---|
| `usuarioId` | `string` | UID do usuário |
| `produtoId` | `string` | ID do produto comprado |
| `nomeProduto` | `string` | Nome do produto |
| `tipoProduto` | `string` | Tipo do produto |
| `urlArquivo` | `string` | URL do arquivo para download |
| `preco` | `number` | Valor pago |
| `stripeSessionId` | `string` | ID da sessão Stripe |
| `paymentIntentId` | `string` | ID do PaymentIntent Stripe |
| `status` | `string` | Status da compra (`aprovado`) |
| `criadoEm` | `Timestamp` | Data da compra |

---

## Autenticação

O sistema de autenticação é gerenciado pelo **Firebase Authentication** e suporta:

- **E-mail e senha** — com validação de campos e mensagens de erro amigáveis
- **Google** — via `GoogleAuthProvider` e `signInWithPopup`
- **GitHub** — via `GithubAuthProvider` e `signInWithPopup`
- **Twitter/X** — via `TwitterAuthProvider` e `signInWithPopup`

O módulo `auth.js` é carregado em todas as páginas e observa o estado de autenticação via `onAuthStateChanged`. Quando o usuário está logado, o header exibe seu nome e um botão de Sign Out. Quando deslogado, exibe os botões de Login e Sign Up.

O `salvarUsuario()` em `db.js` utiliza `setDoc` com `merge: true` para garantir que o documento do usuário use o UID como ID (e não um ID aleatório gerado por `addDoc`), permitindo consultas diretas por UID.

Os endpoints da API que exigem autenticação validam o **Firebase ID Token** via `admin.auth().verifyIdToken(token)` no servidor, utilizando o header `Authorization: Bearer <token>`.

---

## Busca com Algolia

A busca utiliza o **Algolia** como motor de pesquisa para oferecer resultados rápidos e relevantes.

### Funcionamento no Front-end (`busca.js`)
- Ao focar na barra de pesquisa, um overlay é exibido com sugestões pré-definidas por categoria (Casa, Natureza, Cidade, HDRIs, Mármore, Modelos 3D)
- À medida que o usuário digita, a busca é feita via API REST do Algolia com debounce
- Os resultados são exibidos em tempo real no painel com imagem, nome e tipo do asset
- Ao pressionar Enter ou clicar em um resultado, o usuário é redirecionado para a página de resultados

### Sincronização Firestore → Algolia (`algolia.js`)
Por segurança, a **Write API Key do Algolia não é exposta no front-end**. O arquivo `algolia.js` contém stubs das funções `algoliaUpsert` e `algoliaDelete` que logam avisos no console. A sincronização deve ser implementada via:
1. **Firebase Cloud Function** com trigger `onDocumentWritten`
2. **Endpoint serverless** protegido no servidor
3. **Integração oficial** Algolia + Firebase Connectors

A **Search-Only Key** (somente leitura) é utilizada com segurança no front-end para consultas.

---

## Painel Administrativo

O painel (`admin.html` + `admin.js`) oferece uma interface completa para gestão do catálogo:

### Seções
- **Dashboard** — Estatísticas rápidas: total de produtos por tipo
- **Produtos** — Tabela com todos os produtos, busca por nome e filtro por tipo
- **Novo Produto** — Atalho que abre o modal de criação

### Modal de Produto
Permite criar ou editar um produto com os campos:
- Nome, tipo, descrição, preço
- Resolução, formato (array), tamanho em MB
- Softwares suportados e motores de render
- Categorias e tags
- Upload de imagem de capa, arquivo do asset e modelo 3D
- Ativar/desativar produto e marcar como destaque

### Upload para Firebase Storage
Os arquivos são enviados com `uploadBytesResumable`, exibindo progresso em tempo real. As URLs geradas pelo Storage são salvas nos campos correspondentes do produto no Firestore.

---

## Integração de Pagamentos (Stripe)

O JoinRender utiliza o **Stripe** para processamento de pagamentos de assets pagos. A integração suporta dois métodos:

### Cartão de Crédito
- O front-end chama `POST /api/criarpagamento` para criar um `PaymentIntent`
- O Stripe Elements é montado com a `clientSecret` retornada
- A confirmação do pagamento ocorre no browser via `stripe.confirmCardPayment()`

### PIX
- O front-end chama `POST /api/criarpix` para criar um `PaymentIntent` com método `pix`
- A API retorna os dados do QR Code (código copia e cola e imagem base64)
- O front-end realiza polling em `GET /api/verificarpix` até o pagamento ser confirmado

### Webhook
O endpoint `POST /api/webhookstripe` recebe notificações assíncronas do Stripe, valida a assinatura com `STRIPE_WEBHOOK_SECRET` e registra compras confirmadas na coleção `compras` do Firestore.

> ⚠️ Para testes, utilize as chaves do modo **test** do Stripe (`sk_test_...` e `pk_test_...`).

---

## Newsletter (Brevo)

O formulário de newsletter presente no rodapé do site envia o e-mail do visitante para `POST /api/assinar`, que o cadastra na lista de ID `3` da plataforma **Brevo** (ex-Sendinblue) via API REST.

A chave da API Brevo é armazenada exclusivamente no servidor via variável de ambiente `BREVO_API_KEY`, nunca exposta no front-end.

---

## CSS — Sistema de Design

O CSS é organizado de forma modular e importado em cascata pelo `css/main.css`.

### Paleta de Cores
A identidade visual do JoinRender é baseada em tons escuros com acentos dourados e creme:

| Variável | Valor | Uso |
|---|---|---|
| `--cor-fundo` | `#1C1515` | Fundo principal |
| `--cor-fundo-escuro` | `#171212` | Fundo mais escuro (header, footer) |
| `--cor-creme` | `#E8DCC4` | Texto principal |
| `--cor-dourado` | `#c8a96e` | Acentos e destaques |
| `--cor-dourado-vivo` | `#D4AF37` | CTAs e elementos interativos |
| `--cor-borda` | `#3a2c2c` | Bordas sutis |
| `--cor-erro` | `#c0524a` | Mensagens de erro |

### Tipografia
| Variável | Fonte | Uso |
|---|---|---|
| `--font-serif` | Playfair Display | Títulos e headings |
| `--font-sans` | DM Sans | Textos de interface |
| `--font-serif-roboto` | Roboto Serif | Textos editoriais |
| `--font-mono` | Recursive | Código e dados técnicos |

### Espaçamentos Fluidos
Todos os espaçamentos usam `clamp()` para escalar suavemente entre telas pequenas e grandes:
```css
--space-sm:  clamp(8px,  2vw, 16px);
--space-md:  clamp(16px, 3vw, 24px);
--space-lg:  clamp(24px, 5vw, 48px);
--space-xl:  clamp(40px, 8vw, 80px);
```

---

## Acessibilidade

O projeto implementa diversas práticas de acessibilidade:

- Todos os elementos interativos possuem `aria-label` descritivos
- O drawer mobile usa `aria-expanded`, `aria-controls` e `aria-hidden` corretamente
- Suporte a fechamento via tecla **ESC** no drawer e overlay de busca
- Labels de formulário com classe `.sr-only` (visualmente ocultos, mas lidos por leitores de tela)
- Atributo `loading="lazy"` em todas as imagens para performance
- Regiões `aria-live="polite"` no painel de busca para anúncio dinâmico de resultados
- Navegação por teclado funcional no drawer mobile (foco retorna ao botão hamburger ao fechar)
- Uso de `role="search"`, `role="dialog"` e `aria-modal` nos componentes apropriados

---

## Configuração do Ambiente

### Pré-requisitos
- Node.js 18+
- Conta no Firebase com projeto configurado
- Conta no Algolia com índice `produtos` criado
- Conta no Stripe para funcionalidades de pagamento
- (Opcional) Conta no Brevo para newsletter

### Configuração do Firebase
1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com)
2. Ative **Authentication** com os provedores: E-mail/Senha, Google, GitHub e Twitter
3. Ative o **Firestore** em modo de produção
4. Ative o **Firebase Storage**
5. Copie as credenciais do projeto para o arquivo `js/nucleo/config.js`
6. Gere uma **Service Account Key** em *Configurações do Projeto → Contas de serviço* e salve como `serviceAccountKey.json` (nunca commite esse arquivo)

### Configuração do Algolia
1. Crie um índice chamado `produtos` no painel do Algolia
2. Configure os campos de busca: `nome`, `descricao`, `tags`, `tipo`, `categorias`
3. Anote a **Application ID** e a **Search-Only API Key** (para o front-end, em `js/nucleo/busca.js`)
4. Anote a **Write API Key** (apenas para uso no servidor — nunca expor no front-end)

### Configuração do Stripe
1. Crie uma conta em [dashboard.stripe.com](https://dashboard.stripe.com)
2. Anote a **Secret Key** (`sk_test_...`) e a **Publishable Key** (`pk_test_...`)
3. Em desenvolvimento, use o **Stripe CLI** para encaminhar webhooks locais:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook-stripe
   ```
4. Copie o `STRIPE_WEBHOOK_SECRET` exibido pelo CLI para o seu `.env`

---

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto para desenvolvimento local:

```env
# Firebase Admin (para as funções serverless)
FIREBASE_PROJECT_ID=joinrender-2ac79
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@joinrender-2ac79.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Ou alternativamente (JSON completo da service account)
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Algolia (somente para sincronização server-side)
ALGOLIA_APP_ID=...
ALGOLIA_WRITE_KEY=...

# Brevo (newsletter)
BREVO_API_KEY=...
```

> ⚠️ **Nunca commitar o arquivo `.env` nem o `serviceAccountKey.json` no repositório.** O `.gitignore` já está configurado para ignorá-los.

Você pode criar um `.env.example` com os nomes das variáveis (sem valores) para facilitar a configuração de outros colaboradores:

```bash
cp .env .env.example
# Apague os valores sensíveis do .env.example antes de commitar
```

---

## Instalação e Execução

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/DesenvolvimentoWebGrupoG.git
cd DesenvolvimentoWebGrupoG

# 2. Instale as dependências da API
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# 4. Inicie o servidor de desenvolvimento da API
npm run dev
# O servidor Express sobe em http://localhost:3000

# 5. Sirva o front-end
# Use qualquer servidor HTTP estático, por exemplo:
npx serve .
# ou com a extensão Live Server no VS Code
```

O front-end pode ser aberto diretamente no browser via `index.html` ou servido localmente. As páginas se comunicam com o Firebase diretamente via SDK do browser, sem necessidade do servidor Node.js para funcionalidades básicas (autenticação, leitura de produtos, download de assets gratuitos).

O servidor Node.js (`npm run dev`) é necessário apenas para as rotas de **pagamento** (Stripe), **newsletter** (Brevo) e endpoints que requerem o **Firebase Admin SDK**.

---

## Deploy no Vercel

O projeto está preparado para deploy serverless no **Vercel**. As funções na pasta `/api` são detectadas automaticamente como Vercel Serverless Functions.

### Passos para deploy

```bash
# 1. Instale a CLI do Vercel (se ainda não tiver)
npm install -g vercel

# 2. Faça login
vercel login

# 3. Deploy de preview
vercel

# 4. Deploy para produção
vercel --prod
```

### Variáveis de ambiente no Vercel

Configure todas as variáveis do `.env` no painel do Vercel em **Settings → Environment Variables**. Elas serão injetadas automaticamente nas funções serverless em produção.

### Configuração do webhook Stripe em produção

Após o deploy, registre o URL do webhook no painel do Stripe:

1. Acesse [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Adicione o endpoint: `https://seu-dominio.vercel.app/api/webhookstripe`
3. Selecione os eventos: `checkout.session.completed`, `payment_intent.succeeded`
4. Copie o **Signing Secret** gerado e adicione-o como `STRIPE_WEBHOOK_SECRET` no Vercel

---

## Como Contribuir

Contribuições são bem-vindas! Siga os passos abaixo:

1. **Fork** o repositório
2. Crie uma **branch** para sua feature ou correção:
   ```bash
   git checkout -b feature/minha-feature
   ```
3. Faça suas alterações e **commite** com mensagens claras:
   ```bash
   git commit -m "feat: adiciona filtro por resolução na busca"
   ```
4. **Push** para a sua branch:
   ```bash
   git push origin feature/minha-feature
   ```
5. Abra um **Pull Request** descrevendo o que foi alterado e por quê

### Boas práticas
- Mantenha a separação de responsabilidades: CSS modular por página/componente, JS por módulo funcional
- Não exponha chaves de API no front-end
- Adicione `aria-label` em novos elementos interativos
- Teste em mobile antes de abrir um PR

---

## Autores

Projeto desenvolvido pelo **Grupo G** como trabalho da disciplina de Desenvolvimento Web.

---

## Licença

© 2026 JoinRender. Todos os direitos reservados.