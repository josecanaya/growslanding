const { invoke } = window.__TAURI__.core;

let rendering = false;

async function render() {
  if (rendering) return;
  rendering = true;
  try {
    const clis = await invoke('detect_clis');
    const container = document.getElementById('clis');
    container.innerHTML = clis.map(c => {
      const badge = c.logged_in ? '<span class="badge ok">Listo</span>'
        : c.installed ? '<span class="badge warn">Sin sesión</span>'
        : '<span class="badge error">No instalado</span>';
      const action = c.logged_in ? ''
        : c.installed ? `<button data-action="login" data-id="${c.id}" data-bin="${c.bin ?? ''}">Login</button>`
        : `<button data-action="install" data-id="${c.id}">Instalar</button>`;
      return `<div class="cli-card">
        <div class="label"><b>${c.label}</b><small>${c.version ?? 'no detectado'}</small></div>
        ${badge}${action}
      </div>`;
    }).join('');
    container.querySelectorAll('button').forEach(btn => btn.addEventListener('click', handleClick));
  } finally {
    rendering = false;
  }
}

async function handleClick(e) {
  const btn = e.currentTarget;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  btn.disabled = true;
  btn.textContent = action === 'install' ? 'Instalando...' : 'Abriendo...';
  const cmd = action === 'install' ? 'install_cli' : 'login_cli';
  const args = action === 'install' ? { id } : { id, bin: btn.dataset.bin };
  const result = await invoke(cmd, args);
  alert(result.message);
  await render();
}

async function refreshPairingStatus() {
  const el = document.getElementById('status');
  const hint = document.getElementById('pair-hint');
  try {
    const status = await invoke('get_connection_status');
    if (status.configured) {
      el.textContent = 'Emparejado con Grows';
      el.classList.add('ok');
      el.classList.remove('warn');
      if (hint) hint.textContent = 'Este PC puede recibir pedidos de la obra. En el globo de Grows deberías poder elegir Claude / Cursor.';
      await invoke('start_worker');
    } else {
      el.textContent = 'Sin emparejar';
      el.classList.remove('ok');
      el.classList.add('warn');
      if (hint) hint.textContent = 'Claude “Listo” acá no alcanza. En Grows (web) abrí el enchufe → Conectar Claude (o Cursor). Windows abrirá esta app con grows://';
    }
  } catch (_) {
    el.textContent = 'Sin emparejar';
    el.classList.add('warn');
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  await render();
  await refreshPairingStatus();
  // Re-chequear por si el deep link guarda el token después del arranque
  setInterval(() => { void refreshPairingStatus(); }, 5000);
});
