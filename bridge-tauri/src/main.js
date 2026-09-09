const { invoke } = window.__TAURI__.core;
window.addEventListener('DOMContentLoaded', () => {
  document.querySelector('p').textContent = 'Listo.';
});
