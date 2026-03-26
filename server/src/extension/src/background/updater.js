const UPDATER_CONFIG = {
  CHECK_INTERVAL_MS: 6 * 60 * 60 * 1000, // 6 horas
  VERSION_ENDPOINT: `${self.CONFIG?.API_BASE_UPDATE || "https://extension-one-psi.vercel.app"}/version`,
  DOWNLOAD_ENDPOINT: `${self.CONFIG?.API_BASE_UPDATE || "https://extension-one-psi.vercel.app"}/download-zip`,
  STORAGE_KEY_VERSION: "updater_installed_version",
  STORAGE_KEY_FILES: "updater_files",
  STORAGE_KEY_LAST_CHECK: "updater_last_check",
};

async function getCurrentInstalledVersion() {
  const result = await chrome.storage.local.get(
    UPDATER_CONFIG.STORAGE_KEY_VERSION,
  );
  return result[UPDATER_CONFIG.STORAGE_KEY_VERSION] || null;
}

async function getManifestVersion() {
  return chrome.runtime.getManifest().version;
}

async function checkForUpdate() {
  console.log("[Updater] Verificando atualizações...");

  try {
    const response = await fetch(UPDATER_CONFIG.VERSION_ENDPOINT, {
      cache: "no-store",
      headers: { "x-api-key": "codxistop123" },
    });

    if (!response.ok) {
      console.warn("[Updater] Falha ao verificar versão:", response.status);
      return null;
    }

    const data = await response.json();
    console.log("[Updater] Versão remota:", data.version);
    return data;
  } catch (err) {
    console.error("[Updater] Erro ao verificar versão:", err);
    return null;
  }
}

async function downloadAndApplyUpdate(downloadUrl) {
  console.log("[Updater] Baixando atualização de:", downloadUrl);

  try {
    const response = await fetch(downloadUrl, {
      headers: { "x-api-key": "codxistop123" },
    });

    if (!response.ok) {
      throw new Error(`Download falhou: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log(
      "[Updater] ZIP baixado, tamanho:",
      arrayBuffer.byteLength,
      "bytes",
    );

    // Extrai o ZIP usando o script JSZip injetado via importScripts
    const files = await extractZip(arrayBuffer);
    console.log("[Updater] Arquivos extraídos:", Object.keys(files));

    return files;
  } catch (err) {
    console.error("[Updater] Erro ao baixar/extrair:", err);
    throw err;
  }
}

async function extractZip(arrayBuffer) {
  // JSZip precisa estar carregado via importScripts no service worker
  if (typeof JSZip === "undefined") {
    throw new Error("JSZip não carregado no service worker");
  }

  const zip = await JSZip.loadAsync(arrayBuffer);
  const files = {};

  const promises = [];
  zip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir) {
      const promise = zipEntry.async("string").then((content) => {
        files[relativePath] = content;
      });
      promises.push(promise);
    }
  });

  await Promise.all(promises);
  return files;
}

async function applyUpdate(files, newVersion) {
  console.log("[Updater] Aplicando atualização versão:", newVersion);

  // Salva os arquivos no chrome.storage.local
  // chrome.storage.local suporta até 10MB por padrão (pode ser aumentado com unlimitedStorage)
  const storageData = {
    [UPDATER_CONFIG.STORAGE_KEY_FILES]: files,
    [UPDATER_CONFIG.STORAGE_KEY_VERSION]: newVersion,
    updater_updated_at: new Date().toISOString(),
  };

  await chrome.storage.local.set(storageData);
  console.log("[Updater] Arquivos salvos no storage.");

  // Notifica todas as tabs abertas do Codxis para recarregar
  notifyTabsToReload();

  return true;
}

function notifyTabsToReload() {
  chrome.tabs.query(
    { url: "https://web.codxis.api.br/sistema/pages/privado/*" },
    (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs
          .sendMessage(tab.id, { type: "EXTENSION_UPDATED" })
          .catch(() => {
            // Tab pode não ter content script carregado, ignorar erro
          });
      });
    },
  );
}

async function runUpdateCheck() {
  // Salva timestamp do último check
  await chrome.storage.local.set({
    [UPDATER_CONFIG.STORAGE_KEY_LAST_CHECK]: Date.now(),
  });

  const remoteData = await checkForUpdate();
  if (!remoteData || !remoteData.version) return;

  const installedVersion =
    (await getCurrentInstalledVersion()) || (await getManifestVersion());

  console.log(
    "[Updater] Versão instalada:",
    installedVersion,
    "→ Remota:",
    remoteData.version,
  );

  if (!isNewerVersion(remoteData.version, installedVersion)) {
    console.log("[Updater] Já na versão mais recente.");
    return;
  }

  console.log("[Updater] Nova versão disponível! Baixando...");

  try {
    const downloadUrl =
      remoteData.download_url || UPDATER_CONFIG.DOWNLOAD_ENDPOINT;
    const files = await downloadAndApplyUpdate(downloadUrl);
    await applyUpdate(files, remoteData.version);

    // Notifica o popup se estiver aberto
    chrome.runtime
      .sendMessage({
        type: "UPDATE_APPLIED",
        version: remoteData.version,
      })
      .catch(() => {});

    console.log(
      "[Updater] Atualização para",
      remoteData.version,
      "aplicada com sucesso!",
    );
  } catch (err) {
    console.error("[Updater] Falha na atualização:", err);
  }
}

function isNewerVersion(remote, local) {
  const parse = (v) => v.split(".").map((n) => parseInt(n, 10));
  const r = parse(remote);
  const l = parse(local);

  for (let i = 0; i < Math.max(r.length, l.length); i++) {
    const rv = r[i] || 0;
    const lv = l[i] || 0;
    if (rv > lv) return true;
    if (rv < lv) return false;
  }
  return false;
}

// Escuta mensagens de content scripts e popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Content script delega injeção ao background para contornar CSP
  if (message.type === "INJECT_UPDATED_SCRIPTS") {
    const tabId = sender.tab?.id;
    if (!tabId) return;

    const { jsFiles, cssFiles } = message;

    chrome.storage.local.get("updater_files").then(async (result) => {
      const files = result["updater_files"] || {};

      // Injeta CSS como strings via chrome.scripting
      for (const filePath of cssFiles) {
        const css = files[filePath];
        if (!css) continue;
        await chrome.scripting
          .insertCSS({
            target: { tabId },
            css,
          })
          .catch(console.error);
      }

      // Injeta JS criando uma tag <script> diretamente na página (world: MAIN).
      for (const filePath of jsFiles) {
        const code = files[filePath];
        if (!code) continue;

        await chrome.scripting
          .executeScript({
            target: { tabId },
            world: "MAIN",
            func: (src, path) => {
              console.log(
                `[Injetor da Extensão] Preparando para injetar: ${path}`,
              );
              try {
                const script = document.createElement("script");
                script.textContent = src;
                script.setAttribute("data-origem", "codxis-updater");

                // Anexa ao DOM e NÃO remove, para podermos ver no DevTools (Aba Elements)
                (document.head || document.documentElement).appendChild(script);

                console.log(`[Injetor da Extensão] Sucesso ao anexar: ${path}`);
              } catch (err) {
                console.error(
                  `[Injetor da Extensão] Falha crítica ao injetar ${path}:`,
                  err,
                );
              }
            },
            args: [code, filePath], // Passamos o filePath também para o log
          })
          .catch((e) =>
            console.error("[Updater] executeScript falhou para", filePath, e),
          );
      }

      console.log("[Updater] Scripts atualizados injetados na tab", tabId);
    });

    return false;
  }

  if (message.type === "CHECK_UPDATE_NOW") {
    runUpdateCheck()
      .then(() => sendResponse({ ok: true }))
      .catch((e) => sendResponse({ ok: false, error: e.message }));
    return true; // resposta assíncrona
  }

  if (message.type === "GET_UPDATE_STATUS") {
    chrome.storage.local
      .get([
        UPDATER_CONFIG.STORAGE_KEY_VERSION,
        UPDATER_CONFIG.STORAGE_KEY_LAST_CHECK,
      ])
      .then((data) => {
        sendResponse({
          installed_version:
            data[UPDATER_CONFIG.STORAGE_KEY_VERSION] ||
            chrome.runtime.getManifest().version,
          last_check: data[UPDATER_CONFIG.STORAGE_KEY_LAST_CHECK] || null,
          manifest_version: chrome.runtime.getManifest().version,
        });
      });
    return true;
  }

  if (message.type === "GET_UPDATED_FILE") {
    // Content script solicita um arquivo atualizado
    const { filePath } = message;
    chrome.storage.local.get(UPDATER_CONFIG.STORAGE_KEY_FILES).then((data) => {
      const files = data[UPDATER_CONFIG.STORAGE_KEY_FILES] || {};
      sendResponse({ content: files[filePath] || null });
    });
    return true;
  }
});

// Agenda verificação periódica
chrome.alarms.create("updater-check", {
  delayInMinutes: 1, // primeira verificação 1 min após instalação
  periodInMinutes: 360, // depois a cada 6h
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "updater-check") {
    runUpdateCheck();
  }
});

// Verifica na instalação/atualização da própria extensão
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install" || details.reason === "update") {
    // Pequeno delay para não competir com o carregamento inicial
    setTimeout(() => runUpdateCheck(), 3000);
  }
});

console.log("[Updater] Service worker iniciado.");
