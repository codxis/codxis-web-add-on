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

function openCustomModal(type) {
  const overlay = document.getElementById("custom-modal-overlay");
  const content = document.getElementById("custom-modal-content");

  content.innerHTML = "";

  if (type === "Cadastrar") {
    content.innerHTML = renderCadastroForm();

    const btnSalvar = document.getElementById("btnSalvar");
    btnSalvar.addEventListener("click", window.handleCadastro);
    
    const cpfInput = document.getElementById("cpf");
    cpfInput.addEventListener("input", (e) => {
      e.target.value = window.formatCPF(e.target.value);
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
      .addEventListener("click", window.carregarLista);
  }

  overlay.classList.add("active");
}

window.openCustomModal = openCustomModal;
