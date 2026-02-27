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

function validateCPF(cpf) {
  cpf = cpf.replace(/\D/g, "");
  
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 > 9) digit1 = 0;
  if (digit1 !== parseInt(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i);
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 > 9) digit2 = 0;
  if (digit2 !== parseInt(cpf[10])) return false;

  return true;
}

function formatCPF(cpf) {
  return cpf
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function showError(message) {
  const errorDiv = document.getElementById("cadastro-error");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
  }
}

function hideError() {
  const errorDiv = document.getElementById("cadastro-error");
  if (errorDiv) {
    errorDiv.style.display = "none";
  }
}
