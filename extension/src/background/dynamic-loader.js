/**
 * dynamic-loader.js
 *
 * Este script é o primeiro a ser carregado em todas as páginas do Codxis.
 * Ele verifica se há arquivos atualizados no chrome.storage.local e,
 * caso haja, carrega a versão atualizada em vez da versão empacotada.
 *
 * Funciona como um "polyfill de sistema de arquivos" para auto-update
 * sem precisar da Chrome Web Store.
 */

(async function initDynamicLoader() {
  const STORAGE_KEY_FILES = "updater_files";
  const STORAGE_KEY_VERSION = "updater_installed_version";

  // Detecta qual página estamos
  const isPDV = window.location.href.includes("/nfce/emissao/pdv/");
  const isIndex = !isPDV;

  // Mapa de arquivos que podem ser atualizados dinamicamente
  const FILE_MAP = {
    pdv: [
      "src/shared/constants.js",
      "src/shared/api.js",
      "src/contents/content.js",
      "src/css/custom-select.css",
    ],
    index: [
      "src/shared/constants.js",
      "src/shared/api.js",
      "src/contents/utils.js",
      "src/contents/handlers.js",
      "src/contents/modal.js",
      "src/contents/menu.js",
      "src/contents/create-referrer.js",
      "src/css/modal.css",
    ],
  };

  const filesToLoad = isPDV ? FILE_MAP.pdv : FILE_MAP.index;

  let updatedFiles = {};

  try {
    const result = await new Promise((resolve) => {
      chrome.storage.local.get(
        [STORAGE_KEY_FILES, STORAGE_KEY_VERSION],
        resolve,
      );
    });

    updatedFiles = result[STORAGE_KEY_FILES] || {};

    if (Object.keys(updatedFiles).length > 0) {
      console.log(
        "[DynamicLoader] Versão atualizada disponível:",
        result[STORAGE_KEY_VERSION],
        "— carregando arquivos do storage.",
      );
    }
  } catch (err) {
    console.warn("[DynamicLoader] Não foi possível ler storage:", err);
  }

  // Injeta cada arquivo (da versão atualizada se disponível, senão da extensão)
  for (const filePath of filesToLoad) {
    const ext = filePath.split(".").pop();

    if (ext === "css") {
      await injectCSS(filePath, updatedFiles[filePath]);
    } else if (ext === "js") {
      await injectJS(filePath, updatedFiles[filePath]);
    }
  }

  console.log("[DynamicLoader] Todos os scripts carregados.");
})();

async function injectJS(filePath, updatedContent) {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.type = "text/javascript";

    if (updatedContent) {
      // Usa o conteúdo atualizado do storage
      const blob = new Blob([updatedContent], {
        type: "application/javascript",
      });
      script.src = URL.createObjectURL(blob);
    } else {
      // Usa o arquivo empacotado na extensão
      script.src = chrome.runtime.getURL(filePath);
    }

    script.onload = () => {
      if (script.src.startsWith("blob:")) {
        URL.revokeObjectURL(script.src);
      }
      resolve();
    };

    script.onerror = (err) => {
      console.error("[DynamicLoader] Erro ao carregar:", filePath, err);
      resolve(); // resolve mesmo com erro para não travar os outros
    };

    (document.head || document.documentElement).appendChild(script);
  });
}

async function injectCSS(filePath, updatedContent) {
  return new Promise((resolve) => {
    if (updatedContent) {
      const style = document.createElement("style");
      style.setAttribute("data-source", filePath);
      style.textContent = updatedContent;
      (document.head || document.documentElement).appendChild(style);
      resolve();
    } else {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = chrome.runtime.getURL(filePath);
      link.onload = resolve;
      link.onerror = resolve;
      (document.head || document.documentElement).appendChild(link);
    }
  });
}

// Escuta mensagem do background para recarregar após atualização
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "EXTENSION_UPDATED") {
    console.log(
      "[DynamicLoader] Atualização recebida! Recarregue a página para aplicar as alterações.",
    );
  }
});
