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
    createItem("Cadastrar", () => window.openCustomModal("Cadastrar")),
  );

  content.appendChild(
    createItem("Consultar", () => window.openCustomModal("Consultar")),
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

function initMenu() {
  window.waitForElement("#participante-topic", () => {
    insertMenuAfterParticipante();
  });
}
