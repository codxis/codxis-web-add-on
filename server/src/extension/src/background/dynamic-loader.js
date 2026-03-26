(async function initDynamicLoader() {
  const STORAGE_KEY_FILES = "updater_files";

  const isPDV = window.location.href.includes("/nfce/emissao/pdv/");

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

  // Lê arquivos atualizados do storage
  let updatedFiles = {};
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY_FILES);
    updatedFiles = result[STORAGE_KEY_FILES] || {};
    if (Object.keys(updatedFiles).length > 0) {
      console.log(
        "[DynamicLoader] Arquivos atualizados encontrados no storage.",
      );
    }
  } catch (err) {
    console.warn("[DynamicLoader] Erro ao ler storage:", err);
  }

  // Injeta CSS
  for (const filePath of cssFiles) {
    await injectCSS(filePath, updatedFiles[filePath]);
  }

  // Injeta JS no contexto do content script (mantém acesso ao chrome API)
  for (const filePath of jsFiles) {
    await injectJS(filePath, updatedFiles[filePath]);
  }

  console.log("[DynamicLoader] Carregamento concluído.");

  // Escuta notificação de atualização
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "EXTENSION_UPDATED") {
      console.log("[DynamicLoader] Atualização aplicada, recarregando...");
      setTimeout(() => window.location.reload(), 1500);
    }
  });
})();

async function injectJS(filePath, updatedContent) {
  let code;

  if (updatedContent) {
    code = updatedContent;
  } else {
    // Lê o arquivo empacotado na extensão via fetch
    try {
      const url = chrome.runtime.getURL(filePath);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      code = await response.text();
    } catch (err) {
      console.error(
        "[DynamicLoader] Erro ao carregar arquivo empacotado:",
        filePath,
        err,
      );
      return;
    }
  }

  // Executa no contexto do content script com new Function
  // Isso mantém acesso ao chrome API e ao DOM, diferente de <script> tags
  try {
    const fn = new Function(code);
    fn();
  } catch (err) {
    console.error("[DynamicLoader] Erro ao executar:", filePath, err);
  }
}

async function injectCSS(filePath, updatedContent) {
  let css;

  if (updatedContent) {
    css = updatedContent;
  } else {
    try {
      const url = chrome.runtime.getURL(filePath);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      css = await response.text();
    } catch (err) {
      console.error("[DynamicLoader] Erro ao carregar CSS:", filePath, err);
      return;
    }
  }

  const style = document.createElement("style");
  style.setAttribute("data-source", filePath);
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);
}
