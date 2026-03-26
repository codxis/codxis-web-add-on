(async function initDynamicLoader() {
  const STORAGE_KEY_FILES = "updater_files";

  const isPDV = window.location.href.includes("/nfce/emissao/pdv");

  const FILE_MAP = {
    pdv: [
      "src/shared/constants.js",
      "src/shared/api.js",
      "src/contents/content.js",
    ],
    index: [
      "src/shared/constants.js",
      "src/shared/api.js",
      "src/contents/utils.js",
      "src/contents/handlers.js",
      "src/contents/modal.js",
      "src/contents/menu.js",
      "src/contents/create-referrer.js",
    ],
    pdv_css: ["src/css/custom-select.css"],
    index_css: ["src/css/modal.css"],
  };

  const jsFiles = isPDV ? FILE_MAP.pdv : FILE_MAP.index;
  const cssFiles = isPDV ? FILE_MAP.pdv_css : FILE_MAP.index_css;

  // Verifica se há arquivos atualizados no storage
  let hasUpdatedFiles = false;
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY_FILES);
    const updatedFiles = result[STORAGE_KEY_FILES] || {};
    hasUpdatedFiles = Object.keys(updatedFiles).length > 0;
  } catch (err) {
    console.warn("[DynamicLoader] Erro ao ler storage:", err);
  }

  if (hasUpdatedFiles) {
    // Delega ao background script, que usa chrome.scripting (sem restrição de CSP)
    console.log(
      "[DynamicLoader] Arquivos atualizados encontrados, delegando ao background...",
    );
    chrome.runtime.sendMessage({
      type: "INJECT_UPDATED_SCRIPTS",
      jsFiles,
      cssFiles,
      tabId: null, // background descobre via sender
    });
  } else {
    // Sem update: carrega arquivos empacotados normalmente via <script src>
    console.log(
      "[DynamicLoader] Sem atualização, carregando arquivos empacotados.",
    );
    for (const filePath of cssFiles) {
      injectPackagedCSS(filePath);
    }
    for (const filePath of jsFiles) {
      await injectPackagedJS(filePath);
    }
  }

  console.log("[DynamicLoader] Inicialização concluída.");

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "EXTENSION_UPDATED") {
      console.log("[DynamicLoader] Atualização aplicada, recarregando...");
      setTimeout(() => window.location.reload(), 1500);
    }
  });
})();

function injectPackagedCSS(filePath) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = chrome.runtime.getURL(filePath);
  (document.head || document.documentElement).appendChild(link);
}

function injectPackagedJS(filePath) {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL(filePath);
    script.onload = resolve;
    script.onerror = () => {
      console.error("[DynamicLoader] Erro ao carregar:", filePath);
      resolve();
    };
    (document.head || document.documentElement).appendChild(script);
  });
}
