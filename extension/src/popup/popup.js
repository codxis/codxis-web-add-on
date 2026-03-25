document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btn");

  if (!btn) return;

  btn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => alert("Olá da extensão! From Vercel"),
      });
    });
  });
});
