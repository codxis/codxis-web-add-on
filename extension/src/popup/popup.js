document.addEventListener("DOMContentLoaded", () => {
  const elInstalledVersion = document.getElementById("installed-version");
  const elManifestVersion = document.getElementById("manifest-version");
  const elLastCheck = document.getElementById("last-check");
  const elStatus = document.getElementById("update-status");
  const elLog = document.getElementById("update-log");
  const btnCheck = document.getElementById("btn-check-update");
  const btnCodxis = document.getElementById("btn-open-codxis");

  function formatDate(timestamp) {
    if (!timestamp) return "Nunca";
    const d = new Date(timestamp);
    return (
      d.toLocaleDateString("pt-BR") +
      " " +
      d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    );
  }

  function log(msg) {
    elLog.style.display = "block";
    elLog.textContent += msg + "\n";
    elLog.scrollTop = elLog.scrollHeight;
  }

  function setStatus(type, text) {
    elStatus.className = "badge badge-" + type;
    elStatus.textContent = text;
  }

  function loadStatus() {
    chrome.runtime.sendMessage({ type: "GET_UPDATE_STATUS" }, (response) => {
      if (chrome.runtime.lastError) {
        setStatus("error", "Erro");
        return;
      }

      elInstalledVersion.textContent = response.installed_version || "—";
      elManifestVersion.textContent = response.manifest_version || "—";
      elLastCheck.textContent = formatDate(response.last_check);

      const isUpdated =
        response.installed_version &&
        response.installed_version !== response.manifest_version;

      if (isUpdated) {
        setStatus("update", "Atualizado (" + response.installed_version + ")");
      } else {
        setStatus("ok", "Atualizado");
      }
    });
  }

  btnCheck.addEventListener("click", () => {
    btnCheck.disabled = true;
    btnCheck.innerHTML = '<span class="spinner"></span>Verificando...';
    elLog.textContent = "";
    elLog.style.display = "block";
    setStatus("checking", "Verificando...");
    log("Iniciando verificação...");

    chrome.runtime.sendMessage({ type: "CHECK_UPDATE_NOW" }, (response) => {
      btnCheck.disabled = false;
      btnCheck.textContent = "Verificar Atualização";

      if (chrome.runtime.lastError || !response?.ok) {
        setStatus("error", "Erro");
        log(
          "Erro ao verificar: " +
            (response?.error || chrome.runtime.lastError?.message),
        );
      } else {
        log("Verificação concluída.");
        loadStatus();
      }
    });
  });

  btnCodxis.addEventListener("click", () => {
    chrome.tabs.create({
      url: "https://web.codxis.api.br/sistema/pages/privado/index/",
    });
  });

  // Escuta notificação de atualização aplicada
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "UPDATE_APPLIED") {
      log("✓ Atualização " + message.version + " aplicada!");
      setStatus("update", "Atualizado → " + message.version);
      loadStatus();
    }
  });

  loadStatus();
});
