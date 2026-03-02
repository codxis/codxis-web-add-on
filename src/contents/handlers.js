const PONTOS_VALOR_REAIS = 0.50;

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getFiltros() {
  return {
    nome: document.getElementById("filtro-nome")?.value.trim() || "",
    cpf: document.getElementById("filtro-cpf")?.value.replace(/\D/g, "") || "",
    apelido: document.getElementById("filtro-apelido")?.value.trim() || "",
    pontos_min: document.getElementById("filtro-pontos-min")?.value || "",
    pontos_max: document.getElementById("filtro-pontos-max")?.value || "",
    ativo: document.getElementById("filtro-ativo")?.value === "" ? undefined : document.getElementById("filtro-ativo")?.value === "true",
  };
}

function renderTabelaIndicadores(data) {
  const tbody = document.getElementById("tabela-corpo");
  
  if (!data || !data.length) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="4">Nenhum indicador encontrado.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = data.map((indicador) => {
    const pontos = indicador.pontos || 0;
    const valorReais = pontos * PONTOS_VALOR_REAIS;

    return `
      <tr data-id="${indicador.id}">
        <td>
          <div class="indicador-nome">
            ${indicador.nome || ""}
            ${indicador.apelido ? `<small>(${indicador.apelido})</small>` : ""}
          </div>
        </td>
        <td>${pontos.toLocaleString("pt-BR")}</td>
        <td>${formatCurrency(valorReais)}</td>
        <td>
          <div class="acoes-dropdown">
            <button class="acoes-btn">⋯</button>
            <div class="acoes-menu">
              <button class="acao-item" data-action="editar" data-id="${indicador.id}">Editar</button>
              <button class="acao-item" data-action="adicionar-pontos" data-id="${indicador.id}">Adicionar Pontos</button>
              <button class="acao-item acao-excluir" data-action="excluir" data-id="${indicador.id}">Excluir</button>
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  document.querySelectorAll(".acoes-dropdown").forEach((dropdown) => {
    const btn = dropdown.querySelector(".acoes-btn");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const menu = dropdown.querySelector(".acoes-menu");
      const isActive = menu.classList.contains("show");
      closeAllAcoesDropdowns();
      if (!isActive) {
        menu.classList.add("show");
      }
    });
  });

  document.querySelectorAll(".acoes-menu .acao-item").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      closeAllAcoesDropdowns();
      if (action === "editar") {
        window.editarIndicador(id);
      } else if (action === "adicionar-pontos") {
        window.adicionarPontosIndicador(id);
      } else if (action === "excluir") {
        window.excluirIndicadorConfirm(id);
      }
    });
  });
}

async function handleConsultar() {
  const filtros = getFiltros();
  await carregarLista(filtros);
}

async function carregarLista(filtros = {}) {
  const errorDiv = document.getElementById("consulta-error");
  const tbody = document.getElementById("tabela-corpo");

  errorDiv.style.display = "none";
  tbody.innerHTML = `
    <tr class="loading-row">
      <td colspan="4">Carregando...</td>
    </tr>
  `;

  try {
    const response = await window.listarIndicadores(filtros);
    renderTabelaIndicadores(response.data || []);
  } catch (err) {
    errorDiv.textContent = "Erro ao buscar indicadores: " + err.message;
    errorDiv.style.display = "block";
    tbody.innerHTML = `
      <tr class="error-row">
        <td colspan="4">Erro ao carregar dados.</td>
      </tr>
    `;
  }
}

async function handleCadastro() {
  const nome = document.getElementById("nome").value.trim();
  const cpfInput = document.getElementById("cpf");
  const cpf = cpfInput.value.trim();
  const apelido = document.getElementById("apelido").value.trim();

  window.hideError();

  if (!nome || !cpf) {
    window.showError("Nome e CPF são obrigatórios.");
    return;
  }

  const cpfDigits = cpf.replace(/\D/g, "");
  if (!window.validateCPF(cpfDigits)) {
    window.showError("CPF inválido.");
    return;
  }

  const btn = document.getElementById("btnSalvar");
  btn.disabled = true;
  btn.classList.add("btn-loading");
  btn.textContent = "Salvando...";

  try {
    await window.cadastrarIndicador({ nome, cpf: cpfDigits, apelido });

    alert("Indicador cadastrado com sucesso!");

    document.getElementById("custom-modal-overlay").classList.remove("active");
  } catch (err) {
    window.showError("Erro ao cadastrar: " + err.message);
  } finally {
    btn.disabled = false;
    btn.classList.remove("btn-loading");
    btn.textContent = "Salvar";
  }
}

let indicadorCache = {};

async function editarIndicador(id) {
  closeAllAcoesDropdowns();

  const errorDiv = document.getElementById("consulta-error");
  errorDiv.style.display = "none";

  try {
    const indicador = await window.buscarIndicador(id);
    indicadorCache[id] = indicador;
    window.openCustomModal("Editar", indicador);
  } catch (err) {
    errorDiv.textContent = "Erro ao buscar indicador: " + err.message;
    errorDiv.style.display = "block";
  }
}

async function handleEditar() {
  const id = document.getElementById("btnSalvarEditar").dataset.id;
  const nome = document.getElementById("edit-nome").value.trim();
  const apelido = document.getElementById("edit-apelido")?.value.trim() || "";

  const errorDiv = document.getElementById("edit-error");
  errorDiv.style.display = "none";

  if (!nome) {
    errorDiv.textContent = "Nome é obrigatório.";
    errorDiv.style.display = "block";
    return;
  }

  const btn = document.getElementById("btnSalvarEditar");
  btn.disabled = true;
  btn.textContent = "Salvando...";

  try {
    await window.atualizarIndicador(id, { nome, apelido });

    alert("Indicador atualizado com sucesso!");

    indicadorCache[id] = { ...indicadorCache[id], nome, apelido };
    window.openCustomModal("Consultar");
    await carregarLista(getFiltros());
  } catch (err) {
    errorDiv.textContent = "Erro ao atualizar: " + err.message;
    errorDiv.style.display = "block";
  } finally {
    btn.disabled = false;
    btn.textContent = "Salvar";
  }
}

function adicionarPontosIndicador(id) {
  closeAllAcoesDropdowns();
  
  const indicador = indicadorCache[id];
  if (indicador) {
    window.openCustomModal("AdicionarPontos", indicador);
  }
}

async function handleAdicionarPontos() {
  const id = document.getElementById("btnSalvarPontos").dataset.id;
  const valorVenda = parseFloat(document.getElementById("pontos-valor").value);
  const referencia = document.getElementById("pontos-referencia").value.trim();

  const errorDiv = document.getElementById("pontos-error");
  errorDiv.style.display = "none";

  if (!valorVenda || valorVenda <= 0) {
    errorDiv.textContent = "Valor da venda é obrigatório.";
    errorDiv.style.display = "block";
    return;
  }

  const btn = document.getElementById("btnSalvarPontos");
  btn.disabled = true;
  btn.textContent = "Processando...";

  try {
    const resultado = await window.adicionarPontos(id, valorVenda, referencia);

    alert(`Pontos adicionados! \nValor da venda: ${formatCurrency(valorVenda)}\nPontos creditados: ${resultado.pontos_creditados}\nTotal de pontos: ${resultado.total_pontos}`);

    window.openCustomModal("Consultar");
    await carregarLista(getFiltros());
  } catch (err) {
    errorDiv.textContent = "Erro ao adicionar pontos: " + err.message;
    errorDiv.style.display = "block";
  } finally {
    btn.disabled = false;
    btn.textContent = "Adicionar Pontos";
  }
}

function excluirIndicadorConfirm(id) {
  closeAllAcoesDropdowns();

  const indicador = indicadorCache[id];
  if (indicador) {
    window.openCustomModal("Excluir", indicador);
  }
}

async function handleExcluir() {
  const id = document.getElementById("btnConfirmarExcluir").dataset.id;

  const errorDiv = document.getElementById("excluir-error");
  errorDiv.style.display = "none";

  const btn = document.getElementById("btnConfirmarExcluir");
  btn.disabled = true;
  btn.textContent = "Excluindo...";

  try {
    await window.excluirIndicador(id);

    alert("Indicador excluído com sucesso!");

    delete indicadorCache[id];
    window.openCustomModal("Consultar");
    await carregarLista(getFiltros());
  } catch (err) {
    errorDiv.textContent = "Erro ao excluir: " + err.message;
    errorDiv.style.display = "block";
  } finally {
    btn.disabled = false;
    btn.textContent = "Excluir";
  }
}

function toggleAcoesDropdown(btn) {
  const dropdown = btn.nextElementSibling;
  const isActive = dropdown.classList.contains("show");

  closeAllAcoesDropdowns();

  if (!isActive) {
    dropdown.classList.add("show");
  }
}

function closeAllAcoesDropdowns() {
  document.querySelectorAll(".acoes-menu.show").forEach((menu) => {
    menu.classList.remove("show");
  });
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".acoes-dropdown")) {
    closeAllAcoesDropdowns();
  }
});

window.handleCadastro = handleCadastro;
window.handleConsultar = handleConsultar;
window.carregarLista = carregarLista;
window.handleEditar = handleEditar;
window.handleAdicionarPontos = handleAdicionarPontos;
window.handleExcluir = handleExcluir;
window.editarIndicador = editarIndicador;
window.adicionarPontosIndicador = adicionarPontosIndicador;
window.excluirIndicadorConfirm = excluirIndicadorConfirm;
window.toggleAcoesDropdown = toggleAcoesDropdown;
