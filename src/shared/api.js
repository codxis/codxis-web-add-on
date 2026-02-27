async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`${CONFIG.API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CONFIG.API_KEY,
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

async function cadastrarIndicador(dados) {
  return apiFetch("/", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

async function listarIndicadores() {
  return apiFetch("/");
}

async function excluirIndicador(id) {
  return apiFetch(`/${id}`, {
    method: "DELETE",
  });
}
