const { invoke } = window.__TAURI__.core;
window.addEventListener('DOMContentLoaded', async () => {
  const clis = await invoke('detect_clis');
  document.querySelector('main').innerHTML = '<h1>CLIs detectados</h1><pre>' + JSON.stringify(clis, null, 2) + '</pre>';
});
