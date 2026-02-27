function createSearchableSelect({
  options,
  placeholder = "",
  searchPlaceholder = "Pesquisar...",
}) {
  const container = document.createElement("div");
  container.className = "custom-select-container";

  // ===== Campo fechado =====
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

  // ===== Dropdown =====
  const dropdown = document.createElement("div");
  dropdown.className = "custom-select-dropdown";

  // ===== Search input =====
  const searchWrapper = document.createElement("div");
  searchWrapper.className = "custom-select-search-wrapper";

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.placeholder = searchPlaceholder;
  searchInput.className = "custom-select-search";

  const searchIcon = document.createElement("span");
  searchIcon.className = "custom-select-search-icon";
  searchIcon.innerHTML = "🔍";

  searchWrapper.appendChild(searchInput);
  searchWrapper.appendChild(searchIcon);

  // ===== Options list =====
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

// ===== Wrapper com Label =====
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

const referrers = [
  { value: 0, label: "" },
  { value: 1, label: "Diego de Sousa Pereira" },
  { value: 2, label: "Willian de Sousa Pereira" },
  { value: 3, label: "Maria Oliveira" },
];

const select = createSearchableSelect({
  options: referrers,
  placeholder: "",
});

const field = createFieldWithLabel("Indicador", select);

const parent = document.getElementById("formNFCe:colaborador").parentElement
  .parentElement;

const firstChild = parent.children[0];

parent.insertBefore(field, firstChild.nextSibling);
