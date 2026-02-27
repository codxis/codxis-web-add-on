// console.log("create referrer....");

// const parent = document.getElementById("menuLateral:j_idt238").parentElement;
// const secondChild = parent.children[1];

// const field = document.createElement("div");
// field.innerText = "hello";
// parent.insertBefore(field, secondChild.nextSibling);

function createCustomMenu() {
  // ===== Container principal =====
  const wrapper = document.createElement("div");
  wrapper.style.paddingTop = "21px";

  // ===== Título principal (colapsável) =====
  const topic = document.createElement("div");
  topic.className = "title-primary-submenu";
  topic.style.cursor = "pointer";

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";
  header.style.width = "100%";

  const span = document.createElement("span");
  span.textContent = "Indicadores";

  const icon = document.createElement("div");
  icon.className = "icon-expand-topics";

  header.appendChild(span);
  header.appendChild(icon);
  topic.appendChild(header);

  // ===== Conteúdo interno =====
  const content = document.createElement("div");
  content.className = "submenu-inside-topics not-show";

  function createItem(label, onClick) {
    const item = document.createElement("div");
    item.className = "submenu-inside-topics-title";

    const link = document.createElement("a");
    link.href = "javascript:void(0)";
    link.className = "ui-link ui-widget";
    link.textContent = label;
    link.addEventListener("click", onClick);

    item.appendChild(link);
    return item;
  }

  content.appendChild(
    createItem("Cadastrar", () => openCustomModal("Cadastrar")),
  );

  content.appendChild(
    createItem("Consultar", () => openCustomModal("Consultar")),
  );

  // ===== Toggle =====
  topic.addEventListener("click", () => {
    content.classList.toggle("not-show");
  });

  wrapper.appendChild(topic);
  wrapper.appendChild(content);

  return wrapper;
}

function insertMenuAfterParticipante() {
  const participanteTopic = document.getElementById("participante-topic");

  if (!participanteTopic) return;

  const participanteWrapper = participanteTopic.parentElement;

  const newMenu = createCustomMenu();

  participanteWrapper.parentElement.insertBefore(
    newMenu,
    participanteWrapper.nextSibling,
  );
}

function renderCadastroForm() {
  return `
    <div class="row" id="cadastro-indicadores">
      
      <div class="form-body">

        <div class="col-12 subtitle-divider-margin">
          <h1 class="subtitle">Cadastro de Indicador</h1>
          <div class="subtitle-divider"></div>
        </div>

        <div class="col-12 col-md-12">
          <label class="form-label">Nome*</label>
          <input 
            type="text" 
            id="nome" 
            class="ui-inputfield ui-inputtext ui-widget ui-state-default ui-corner-all form-input"
            maxlength="150"
          />
        </div>

        <div class="col-12 col-md-6">
          <label class="form-label">CPF*</label>
          <input 
            type="text" 
            id="cpf" 
            class="ui-inputfield ui-inputtext ui-widget ui-state-default ui-corner-all form-input"
            maxlength="14"
          />
        </div>

        <div class="col-12 col-md-12">
          <label class="form-label">Apelido</label>
          <input 
            type="text" 
            id="apelido" 
            class="ui-inputfield ui-inputtext ui-widget ui-state-default ui-corner-all form-input"
          />
        </div>

      </div>

      <div class="form-footer">
        <button 
          class="ui-button ui-widget ui-state-default ui-corner-all"
          onclick="handleCadastro()"
        >
          Salvar
        </button>
      </div>

    </div>
  `;
}

// Aguarda render do JSF
setTimeout(insertMenuAfterParticipante, 1000);

function createModal() {
  const overlay = document.createElement("div");
  overlay.id = "custom-modal-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0,0,0,0.4)";
  overlay.style.display = "none";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "9999";

  const modal = document.createElement("div");
  modal.style.background = "#fff";
  modal.style.padding = "20px";
  modal.style.borderRadius = "8px";
  modal.style.minWidth = "400px";
  modal.style.position = "relative";

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "X";
  closeBtn.style.position = "absolute";
  closeBtn.style.top = "10px";
  closeBtn.style.right = "10px";
  closeBtn.style.cursor = "pointer";

  closeBtn.addEventListener("click", () => {
    overlay.style.display = "none";
  });

  const content = document.createElement("div");
  content.id = "custom-modal-content";

  modal.appendChild(closeBtn);
  modal.appendChild(content);
  overlay.appendChild(modal);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.style.display = "none";
    }
  });

  document.body.appendChild(overlay);
}

function openCustomModal(type) {
  const overlay = document.getElementById("custom-modal-overlay");
  const content = document.getElementById("custom-modal-content");

  content.innerHTML = ""; // limpa conteúdo anterior

  if (type === "Cadastrar") {
    content.innerHTML = renderCadastroForm();

    // document
    //   .getElementById("btnSalvar")
    //   .addEventListener("click", handleCadastro);
  }

  if (type === "Consultar") {
    content.innerHTML = `
      <h2>Consultar Indicadores</h2>
      <button id="btnCarregar">Carregar Lista</button>
      <ul id="lista-indicadores" style="margin-top:15px;"></ul>
    `;

    document
      .getElementById("btnCarregar")
      .addEventListener("click", carregarLista);
  }

  overlay.style.display = "flex";
}

createModal();

const API_BASE =
  "https://iofeislqynfuerypxrpt.supabase.co/functions/v1/indicadores-api";

const API_KEY = "codxistop123";
// const TOKEN = "SEU_JWT_AQUI"; // se usar bearer

async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

async function cadastrarIndicador(dados) {
  return apiFetch("/", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

async function handleCadastro() {
  const nome = document.getElementById("nome").value.trim();
  const cpf = document.getElementById("cpf").value.trim();
  const apelido = document.getElementById("apelido").value.trim();

  if (!nome || !cpf) {
    alert("Nome e CPF são obrigatórios.");
    return;
  }

  try {
    const btn = document.getElementById("btnSalvar");
    btn.disabled = true;
    btn.textContent = "Salvando...";

    await cadastrarIndicador({ nome, cpf, apelido });

    alert("Indicador cadastrado com sucesso!");

    document.getElementById("custom-modal-overlay").style.display = "none";
  } catch (err) {
    alert("Erro ao cadastrar: " + err.message);
  } finally {
    const btn = document.getElementById("btnSalvar");
    btn.disabled = false;
    btn.textContent = "Salvar";
  }
}

async function listarIndicadores() {
  return apiFetch("/");
}

async function carregarLista() {
  const lista = document.getElementById("lista-indicadores");
  lista.innerHTML = "Carregando...";

  try {
    const response = await listarIndicadores();

    lista.innerHTML = "";

    if (!response.data.length) {
      lista.innerHTML = "<li>Nenhum indicador encontrado</li>";
      return;
    }

    response.data.forEach((indicador) => {
      const li = document.createElement("li");
      li.style.padding = "6px 0";
      li.innerHTML = `
        <strong>${indicador.nome}</strong><br/>
        CPF: ${indicador.cpf}<br/>
        Pontos: ${indicador.pontos}
      `;
      lista.appendChild(li);
    });
  } catch (err) {
    lista.innerHTML = "<li>Erro ao buscar indicadores</li>";
  }
}
