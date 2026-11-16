// Sesión HTTP de un actor ficticio. Usa SOLO permisos normales: inicia sesión con email y contraseña
// en Auth y habla con la API de Next con la misma cookie que deja el navegador (sb-<ref>-auth-token).
export class Sesion {
  constructor(entorno, identidad, clave) {
    this.entorno = entorno; this.identidad = identidad; this.clave = clave; this.tokens = null;
    this.cookieNombre = `sb-${new URL(entorno.api).hostname.split('.')[0]}-auth-token`;
  }
  get id() { return this.identidad.id; }

  async ingresar() {
    const res = await fetch(`${this.entorno.api}/auth/v1/token?grant_type=password`, {
      method: 'POST', headers: { apikey: this.entorno.anon, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: this.identidad.email, password: this.identidad.password }),
    });
    if (!res.ok) throw new Error(`No pudo ingresar ${this.clave}: ${res.status} ${await res.text()}`);
    this.tokens = await res.json();
    this.vence = Date.now() + (this.tokens.expires_in - 120) * 1000;
    return this;
  }
  async cookie() {
    if (!this.tokens || Date.now() > this.vence) await this.ingresar();
    const valor = JSON.stringify([this.tokens.access_token, this.tokens.refresh_token, null, null, null]);
    return `${this.cookieNombre}=${encodeURIComponent(valor)}`;
  }
  /** Pedido a la API del producto. Nunca lanza por status: devuelve { status, cuerpo }. */
  async pedir(metodo, ruta, { cuerpo, idem, form, signal, anonimo } = {}) {
    const headers = anonimo ? {} : { Cookie: await this.cookie() };
    if (idem) headers['Idempotency-Key'] = idem;
    let body;
    if (form) body = form;
    else if (cuerpo !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(cuerpo); }
    const res = await fetch(this.entorno.web + ruta, { method: metodo, headers, body, signal, redirect: 'manual' });
    const texto = await res.text();
    let json = null;
    try { json = texto ? JSON.parse(texto) : null; } catch { json = { _texto: texto }; }
    return { status: res.status, cuerpo: json };
  }
  get(ruta, opciones) { return this.pedir('GET', ruta, opciones); }
  post(ruta, cuerpo, idem, opciones = {}) { return this.pedir('POST', ruta, { cuerpo, idem, ...opciones }); }
  put(ruta, cuerpo) { return this.pedir('PUT', ruta, { cuerpo }); }
  accion(obraId, accion, cuerpo, idem, opciones) { return this.post(`/api/obras/${obraId}/circuito/${accion}`, cuerpo, idem, opciones); }
  async evidencia(obraId, entidad, entidadId, nombre, contenido, tipo = 'text/plain') {
    const form = new FormData();
    form.set('entidad', entidad); form.set('entidad_id', entidadId);
    form.set('archivo', new File([contenido], nombre, { type: tipo }));
    return this.pedir('POST', `/api/obras/${obraId}/circuito/evidencias`, { form });
  }
  /** Acceso directo a la base con el token del usuario (para demostrar que RLS lo rechaza). */
  async restDirecto(metodo, ruta, cuerpo) {
    await this.cookie();
    const res = await fetch(`${this.entorno.api}/rest/v1/${ruta}`, { method: metodo,
      headers: { apikey: this.entorno.anon, Authorization: `Bearer ${this.tokens.access_token}`, 'Content-Type': 'application/json' },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined });
    const texto = await res.text();
    let json = null; try { json = texto ? JSON.parse(texto) : null; } catch { json = texto.slice(0, 200); }
    return { status: res.status, cuerpo: json };
  }
}
