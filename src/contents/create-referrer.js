function createCustomMenu() {
  const wrapper = document.createElement("div");
  wrapper.style.paddingTop = "21px";

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

function waitForElement(selector, callback, maxAttempts = 10) {
  let attempts = 0;
  const interval = setInterval(() => {
    const element = document.querySelector(selector);
    if (element) {
      clearInterval(interval);
      callback(element);
    }
    attempts++;
    if (attempts >= maxAttempts) {
      clearInterval(interval);
    }
  }, 500);
}

function initMenu() {
  waitForElement("#participante-topic", () => {
    insertMenuAfterParticipante();
  });
}

function validateCPF(cpf) {
  cpf = cpf.replace(/\D/g, "");
  
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 > 9) digit1 = 0;
  if (digit1 !== parseInt(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i);
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 > 9) digit2 = 0;
  if (digit2 !== parseInt(cpf[10])) return false;

  return true;
}

function formatCPF(cpf) {
  return cpf
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
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
            placeholder="000.000.000-00"
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

      <div id="cadastro-error" class="error-message" style="display: none;"></div>

      <div class="form-footer">
        <button 
          id="btnSalvar"
          class="ui-button ui-widget ui-state-default ui-corner-all"
        >
          Salvar
        </button>
      </div>
    </div>
  `;
}

function createModal() {
  const overlay = document.createElement("div");
  overlay.id = "custom-modal-overlay";

  const modal = document.createElement("div");
  modal.id = "custom-modal";

  const closeBtn = document.createElement("button");
  closeBtn.className = "modal-close";
  closeBtn.textContent = "X";

  closeBtn.addEventListener("click", () => {
    overlay.classList.remove("active");
  });

  const content = document.createElement("div");
  content.id = "custom-modal-content";

  modal.appendChild(closeBtn);
  modal.appendChild(content);
  overlay.appendChild(modal);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.classList.remove("active");
    }
  });

  document.body.appendChild(overlay);
}

function openCustomModal(type) {
  const overlay = document.getElementById("custom-modal-overlay");
  const content = document.getElementById("custom-modal-content");

  content.innerHTML = "";

  if (type === "Cadastrar") {
    content.innerHTML = renderCadastroForm();

    const btnSalvar = document.getElementById("btnSalvar");
    btnSalvar.addEventListener("click", handleCadastro);
    
    const cpfInput = document.getElementById("cpf");
    cpfInput.addEventListener("input", (e) => {
      e.target.value = formatCPF(e.target.value);
    });
  }

  if (type === "Consultar") {
    content.innerHTML = `
      <h2>Consultar Indicadores</h2>
      <button id="btnCarregar" class="ui-button ui-widget ui-state-default ui-corner-all">
        Carregar Lista
      </button>
      <ul id="lista-indicadores" style="margin-top: 15px;"></ul>
    `;

    document
      .getElementById("btnCarregar")
      .addEventListener("click", carregarLista);
  }

  overlay.classList.add("active");
}

function showError(message) {
  const errorDiv = document.getElementById("cadastro-error");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
  }
}

function hideError() {
  const errorDiv = document.getElementById("cadastro-error");
  if (errorDiv) {
    errorDiv.style.display = "none";
  }
}

async function handleCadastro() {
  const nome = document.getElementById("nome").value.trim();
  const cpfInput = document.getElementById("cpf");
  const cpf = cpfInput.value.trim();
  const apelido = document.getElementById("apelido").value.trim();

  hideError();

  if (!nome || !cpf) {
    showError("Nome e CPF são obrigatórios.");
    return;
  }

  const cpfDigits = cpf.replace(/\D/g, "");
  if (!validateCPF(cpfDigits)) {
    showError("CPF inválido.");
    return;
  }

  const btn = document.getElementById("btnSalvar");
  btn.disabled = true;
  btn.classList.add("btn-loading");
  btn.textContent = "Salvando...";

  try {
    await cadastrarIndicador({ nome, cpf: cpfDigits, apelido });

    alert("Indicador cadastrado com sucesso!");

    document.getElementById("custom-modal-overlay").classList.remove("active");
  } catch (err) {
    showError("Erro ao cadastrar: " + err.message);
  } finally {
    btn.disabled = false;
    btn.classList.remove("btn-loading");
    btn.textContent = "Salvar";
  }
}

async function carregarLista() {
  const lista = document.getElementById("lista-indicadores");
  lista.innerHTML = "Carregando...";

  try {
    const response = await listarIndicadores();

    lista.innerHTML = "";

    if (!response.data || !response.data.length) {
      lista.innerHTML = "<li>Nenhum indicador encontrado</li>";
      return;
    }

    response.data.forEach((indicador) => {
      const li = document.createElement("li");
      li.style.padding = "6px 0";
      li.innerHTML = `
        <strong>${indicador.nome}</strong><br/>
        CPF: ${formatCPF(indicador.cpf)}
      `;
      lista.appendChild(li);
    });
  } catch (err) {
    lista.innerHTML = "<li>Erro ao buscar indicadores</li>";
  }
}

createModal();
initMenu();
