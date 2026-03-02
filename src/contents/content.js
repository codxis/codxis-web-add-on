function createSearchableSelect({
  options,
  placeholder = "",
  searchPlaceholder = "Pesquisar...",
}) {
  const container = document.createElement("div");
  container.className = "custom-select-container";

  const trigger = document.createElement("div");
  trigger.className = "custom-select-trigger";

  const triggerText = document.createElement("span");
  triggerText.className = "custom-select-text";
  triggerText.textContent = placeholder;

  const arrow = document.createElement("span");
  arrow.className = "custom-select-arrow";
  arrow.innerHTML = "&#8250;";

  trigger.appendChild(triggerText);
  trigger.appendChild(arrow);

  const dropdown = document.createElement("div");
  dropdown.className = "custom-select-dropdown";

  const searchWrapper = document.createElement("div");
  searchWrapper.className = "custom-select-search-wrapper";

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = searchPlaceholder;
  searchInput.className = "custom-select-search";

  const searchIcon = document.createElement("span");
  searchIcon.className = "custom-select-search-icon";
  searchIcon.innerHTML = "&#128269;";

  searchWrapper.appendChild(searchInput);
  searchWrapper.appendChild(searchIcon);

  const list = document.createElement("ul");
  list.className = "custom-select-list";

  function renderOptions(filter = "") {
    list.innerHTML = "";

    options
      .filter((opt) => opt.label.toLowerCase().includes(filter.toLowerCase()))
      .forEach((opt) => {
        const li = document.createElement("li");
        li.textContent = opt.label;
        li.className = "custom-select-item";

        li.addEventListener("click", () => {
          triggerText.textContent = opt.label;
          dropdown.style.display = "none";
        });

        list.appendChild(li);
      });
  }

  renderOptions();

  searchInput.addEventListener("input", (e) => {
    renderOptions(e.target.value);
  });

  trigger.addEventListener("click", () => {
    dropdown.style.display =
      dropdown.style.display === "block" ? "none" : "block";
    searchInput.focus();
  });

  document.addEventListener("click", (event) => {
    if (!container.contains(event.target)) {
      dropdown.style.display = "none";
    }
  });

  dropdown.appendChild(searchWrapper);
  dropdown.appendChild(list);

  container.appendChild(trigger);
  container.appendChild(dropdown);

  return container;
}

function createFieldWithLabel(labelText, selectElement) {
  const fieldWrapper = document.createElement("div");
  fieldWrapper.className = "custom-field-wrapper";

  const label = document.createElement("label");
  label.textContent = labelText;
  label.className = "form-label";

  fieldWrapper.appendChild(label);
  fieldWrapper.appendChild(selectElement);

  return fieldWrapper;
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

function initSelectIndicador() {
  const targetElement = document.getElementById("formNFCe:colaborador");

  if (!targetElement) return;

  const parent = targetElement.parentElement.parentElement;

  if (parent.querySelector(".custom-field-wrapper")) return;

  const select = createSearchableSelect({
    options: [],
    placeholder: "Selecione um indicador",
  });

  const field = createFieldWithLabel("Indicador", select);

  const firstChild = parent.children[0];
  parent.insertBefore(field, firstChild.nextSibling);

  loadIndicadores(select, createSearchableSelect);
}

async function loadIndicadores(selectElement, createFn) {
  try {
    const response = await listarIndicadores({ ativo: true });

    if (!response.data || !response.data.length) {
      return;
    }

    const options = response.data.map((indicador) => ({
      value: indicador.id,
      label: indicador.apelido || indicador.nome,
    }));

    const newSelect = createFn({
      options: options,
      placeholder: "Selecione um indicador",
    });

    const field = createFieldWithLabel("Indicador", newSelect);
    const parent = selectElement.parentElement.parentElement;
    const oldField = parent.querySelector(".custom-field-wrapper");
    
    if (oldField) {
      parent.replaceChild(field, oldField);
    }
  } catch (err) {
    console.error("Erro ao carregar indicadores:", err);
  }
}

waitForElement("#formNFCe\\:colaborador", initSelectIndicador);
