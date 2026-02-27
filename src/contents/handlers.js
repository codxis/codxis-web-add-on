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

async function carregarLista() {
  const lista = document.getElementById("lista-indicadores");
  lista.innerHTML = "Carregando...";

  try {
    const response = await window.listarIndicadores();

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
        CPF: ${window.formatCPF(indicador.cpf)}
      `;
      lista.appendChild(li);
    });
  } catch (err) {
    lista.innerHTML = "<li>Erro ao buscar indicadores</li>";
  }
}

window.handleCadastro = handleCadastro;
window.carregarLista = carregarLista;
