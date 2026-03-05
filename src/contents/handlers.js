const PONTOS_VALOR_REAIS = 0.50;

const indicadoresCache = {
  data: null,
  timestamp: null,
  TTL: 60 * 60 * 1000, // 1 hora
};

function isCacheValid() {
  if (!indicadoresCache.data || !indicadoresCache.timestamp) return false;
  return Date.now() - indicadoresCache.timestamp < indicadoresCache.TTL;
}

function invalidateCache() {
  indicadoresCache.data = null;
  indicadoresCache.timestamp = null;
}

function setCache(data) {
  indicadoresCache.data = data;
  indicadoresCache.timestamp = Date.now();
}

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
    ativo: true,
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
          <div class="acoes-dropdown" data-id="${indicador.id}">
            <button class="acoes-btn">⋯</button>
            <div class="acoes-menu">
              <button class="acao-item" data-action="editar">Editar</button>
              <button class="acao-item" data-action="adicionar-pontos">Adicionar Pontos</button>
              <button class="acao-item" data-action="resgatar-pontos">Resgatar Pontos</button>
              <button class="acao-item acao-excluir" data-action="excluir">Excluir</button>
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function setupTabelaEventListeners() {
  const tbody = document.getElementById("tabela-corpo");
  if (!tbody) return;

  if (tbody.dataset.listenersAdded) return;
  tbody.dataset.listenersAdded = "true";

  tbody.addEventListener("click", (e) => {
    const dropdown = e.target.closest(".acoes-dropdown");
    const acaoItem = e.target.closest(".acao-item");

    if (e.target.classList.contains("acoes-btn") && dropdown) {
      e.stopPropagation();
      const menu = dropdown.querySelector(".acoes-menu");
      const isActive = menu.classList.contains("show");
      closeAllAcoesDropdowns();
      if (!isActive) {
        menu.classList.add("show");
      }
      return;
    }

      if (acaoItem && dropdown) {
      const action = acaoItem.dataset.action;
      const id = dropdown.dataset.id;
      closeAllAcoesDropdowns();
      if (action === "editar") {
        window.editarIndicador(id);
      } else if (action === "adicionar-pontos") {
        window.adicionarPontosIndicador(id);
      } else if (action === "resgatar-pontos") {
        window.resgatarPontosIndicador(id);
      } else if (action === "excluir") {
        window.excluirIndicadorConfirm(id);
      }
      return;
    }
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
  
  const isDefaultQuery = filtros.ativo === true && 
    !filtros.nome && !filtros.cpf && !filtros.apelido && 
    !filtros.pontos_min && !filtros.pontos_max;
  
  if (isDefaultQuery && isCacheValid()) {
    renderTabelaIndicadores(indicadoresCache.data || []);
    return;
  }

  tbody.innerHTML = `
    <tr class="loading-row">
      <td colspan="4">Carregando...</td>
    </tr>
  `;

  try {
    const response = await window.listarIndicadores(filtros);
    
    if (isDefaultQuery) {
      setCache(response.data || []);
      response.data?.forEach((ind) => {
        indicadorCache[ind.id] = ind;
      });
    }
    
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
  const dataNascimento = document.getElementById("data_nascimento").value;
  const telefone = document.getElementById("telefone").value.trim();

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
    await window.cadastrarIndicador({ 
      nome, 
      cpf: cpfDigits, 
      apelido,
      data_nascimento: dataNascimento || null,
      telefone: telefone || null
    });

    alert("Indicador cadastrado com sucesso!");
    invalidateCache();

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

  if (indicadorCache[id]) {
    window.openCustomModal("Editar", indicadorCache[id]);
    return;
  }

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
  const nome = document.getElementById("nome").value.trim();
  const apelido = document.getElementById("apelido")?.value.trim() || "";
  const dataNascimento = document.getElementById("data_nascimento")?.value || null;
  const telefone = document.getElementById("telefone")?.value.trim() || null;

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
    await window.atualizarIndicador(id, { 
      nome, 
      apelido,
      data_nascimento: dataNascimento,
      telefone: telefone
    });

    alert("Indicador atualizado com sucesso!");
    invalidateCache();

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
  } else {
    window.buscarIndicador(id).then((data) => {
      indicadorCache[id] = data;
      window.openCustomModal("AdicionarPontos", data);
    }).catch((err) => {
      console.error("Erro ao buscar indicador:", err);
    });
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
    invalidateCache();

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
  } else {
    window.buscarIndicador(id).then((data) => {
      indicadorCache[id] = data;
      window.openCustomModal("Excluir", data);
    }).catch((err) => {
      console.error("Erro ao buscar indicador:", err);
    });
  }
}

function resgatarPontosIndicador(id) {
  closeAllAcoesDropdowns();
  
  const indicador = indicadorCache[id];
  if (indicador) {
    window.openCustomModal("ResgatarPontos", indicador);
  } else {
    window.buscarIndicador(id).then((data) => {
      indicadorCache[id] = data;
      window.openCustomModal("ResgatarPontos", data);
    }).catch((err) => {
      console.error("Erro ao buscar indicador:", err);
    });
  }
}

async function handleResgatarPontos() {
  const id = document.getElementById("btnConfirmarResgate").dataset.id;
  const pontosInput = document.getElementById("resgate-pontos");
  const pontos = parseFloat(pontosInput.value);
  const observacao = document.getElementById("resgate-observacao").value.trim();

  const errorDiv = document.getElementById("resgate-error");
  errorDiv.style.display = "none";

  if (!pontos || pontos <= 0) {
    errorDiv.textContent = "Quantidade de pontos é obrigatória.";
    errorDiv.style.display = "block";
    return;
  }

  const indicador = indicadorCache[id];
  if (pontos > (indicador?.pontos || 0)) {
    errorDiv.textContent = "Pontos insuficientes.";
    errorDiv.style.display = "block";
    return;
  }

  const btn = document.getElementById("btnConfirmarResgate");
  btn.disabled = true;
  btn.textContent = "Processando...";

  try {
    const resultado = await window.rescatarPontos(id, pontos, observacao);

    alert(`Resgate realizado com sucesso! \nPontos resgatados: ${resultado.pontos_resgatados}\nValor em R$: ${formatCurrency(resultado.valor_reais)}\nSaldo restante: ${resultado.saldo_restante}`);
    invalidateCache();

    delete indicadorCache[id];
    window.openCustomModal("Consultar");
    await carregarLista(getFiltros());
  } catch (err) {
    errorDiv.textContent = "Erro ao rescindir pontos: " + err.message;
    errorDiv.style.display = "block";
  } finally {
    btn.disabled = false;
    btn.textContent = "Resgatar Pontos";
  }
}

async function handleExcluir() {
  const btn = document.getElementById("btnConfirmarExcluir");
  const id = btn?.dataset.id;

  if (!id) {
    console.error("ID do indicador não encontrado");
    return;
  }

  const errorDiv = document.getElementById("excluir-error");
  errorDiv.style.display = "none";

  btn.disabled = true;
  btn.textContent = "Excluindo...";

  try {
    console.log("Excluindo indicador com ID:", id);
    const result = await window.excluirIndicador(id);
    console.log("Resultado da exclusão:", result);

    alert("Indicador excluído com sucesso!");
    invalidateCache();

    delete indicadorCache[id];
    window.openCustomModal("Consultar");
    await carregarLista(getFiltros());
  } catch (err) {
    console.error("Erro ao excluir:", err);
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
window.handleResgatarPontos = handleResgatarPontos;
window.editarIndicador = editarIndicador;
window.adicionarPontosIndicador = adicionarPontosIndicador;
window.resgatarPontosIndicador = resgatarPontosIndicador;
window.excluirIndicadorConfirm = excluirIndicadorConfirm;
window.toggleAcoesDropdown = toggleAcoesDropdown;
window.getFiltros = getFiltros;
window.setupTabelaEventListeners = setupTabelaEventListeners;
