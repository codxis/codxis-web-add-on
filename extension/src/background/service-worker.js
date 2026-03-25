// service-worker.js
// Entry point do background da extensão.
// Importa JSZip (necessário para extrair ZIPs de atualização) e o updater.

// importScripts(
//   "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
// );

importScripts("../libs/jszip.min.js");

// Importa o updater após JSZip estar disponível no escopo global
importScripts("./updater.js");
