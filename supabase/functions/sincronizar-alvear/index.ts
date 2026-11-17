import { createRemoteJWKSet, jwtVerify } from 'npm:jose@6.1.3';

const issuer = 'https://token.actions.githubusercontent.com';
const jwks = createRemoteJWKSet(new URL(issuer + '/.well-known/jwks'));
const audience = 'grows:feed:pasaje-alvear';
const repository = 'josecanaya/growslanding';
const obra = '569e1eda-3fcb-453a-b394-d8a1a536648e';
const org = '948f6c0e-8f19-49db-b371-78f44ea17943';
const porcentaje = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100;

Deno.serve(async (request) => {
  if (request.method !== 'POST') return Response.json({ error: 'Método inválido' }, { status: 405 });
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return Response.json({ error: 'Falta autenticación' }, { status: 401 });
  let corrida: string;
  try {
    const { payload } = await jwtVerify(authorization.slice(7), jwks, {
      issuer, audience, algorithms: ['RS256'], subject: 'repo:' + repository + ':ref:refs/heads/main',
      requiredClaims: ['exp', 'iat', 'nbf'], maxTokenAge: '10m',
    });
    if (payload.repository_id !== '1090507347' || payload.ref !== 'refs/heads/main' ||
        payload.workflow_ref !== repository + '/.github/workflows/grows-circuito-qa.yml@refs/heads/main' ||
        !['push', 'schedule', 'workflow_dispatch'].includes(String(payload.event_name)) ||
        typeof payload.run_id !== 'string' || !/^\d+$/.test(payload.run_id)) {
      return Response.json({ error: 'Workflow no autorizado' }, { status: 403 });
    }
    corrida = payload.run_id;
  } catch {
    return Response.json({ error: 'Credencial inválida' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const ficha = body?.ficha;
  if (body?.obra !== 'pasaje-alvear' || !Number.isInteger(body.dia) || body.dia < 0 || body.dia > 112 ||
      !['normal', 'reprogramada', 'en_cierre', 'cerrada'].includes(ficha?.estado) ||
      !porcentaje(ficha?.avance_fisico_pct) || !porcentaje(ficha?.certificado_pct) || !porcentaje(ficha?.pagado_pct) ||
      typeof ficha?.caja_simulada !== 'number' || !Number.isFinite(ficha.caja_simulada) ||
      !Number.isInteger(ficha?.contratos) || ficha.contratos < 0 || ficha.contratos > 100 ||
      !(Array.isArray(ficha.rondas) && ficha.rondas.length <= 12 && ficha.rondas.every((r: any) =>
        typeof r?.estado === 'string' && /^[a-z_]{1,40}$/.test(r.estado) &&
        Number.isSafeInteger(r.mcu_integradas) && r.mcu_integradas >= 0))) {
    return Response.json({ error: 'Bitácora inválida' }, { status: 400 });
  }

  const url = new URL('/rest/v1/obras', Deno.env.get('SUPABASE_URL'));
  url.search = new URLSearchParams({ id: 'eq.' + obra, org_id: 'eq.' + org,
    name: 'eq.Pasaje Alvear', select: 'id,canvas_ui,updated_at' }).toString();
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const headers = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
  try {
    const current = await fetch(url, { headers });
    if (!current.ok) throw new Error('lectura');
    const [fila] = await current.json();
    const publicacion = fila?.canvas_ui?.publication;
    if (publicacion?.visible !== true || publicacion.title !== 'Pasaje Alvear') {
      return Response.json({ error: 'Publicación no disponible' }, { status: 409 });
    }
    const anterior = publicacion.simulation;
    if (anterior && (anterior.dia > body.dia ||
        (anterior.dia === body.dia && BigInt(anterior.corrida) >= BigInt(corrida)))) {
      return Response.json({ actualizado: false, dia: anterior.dia, corrida: anterior.corrida });
    }
    const fases: Record<string, string> = { reprogramada: 'Obra reprogramada', en_cierre: 'En proceso de cierre', cerrada: 'Obra cerrada' };
    const fase = fases[ficha.estado] ?? (body.dia >= 88 ? 'Terminaciones' :
      body.dia >= 65 ? 'Instalaciones y estructura' : body.dia >= 23 ? 'Fundaciones y estructura' : 'Planificación y estructura');
    const fecha = new Date().toISOString();
    const simulation = {
      dia: body.dia, corrida, fecha, estado: ficha.estado, avance_fisico_pct: ficha.avance_fisico_pct,
      certificado_pct: ficha.certificado_pct, pagado_pct: ficha.pagado_pct,
      caja_simulada: ficha.caja_simulada, contratos: ficha.contratos,
      rondas: ficha.rondas.map(({ estado, mcu_integradas }: { estado: string; mcu_integradas: number }) => ({ estado, mcu_integradas })),
    };
    const stage = fase + ' · día ' + body.dia;
    const nota = 'Simulación sin inversión real. Día ' + body.dia + ': avance físico ' + ficha.avance_fisico_pct +
      '%, certificado ' + ficha.certificado_pct + '%, pagado ' + ficha.pagado_pct + '%.';
    const milestones = [
      { title: 'Primera ronda de ensayo', status: body.dia >= 8 ? 'validado' : 'en_curso' },
      { title: 'Adjudicación de estructura', status: body.dia >= 8 ? 'validado' : 'pendiente' },
      { title: 'Fundaciones', status: body.dia >= 23 ? 'validado' : 'en_curso' },
    ];
    url.searchParams.set('updated_at', fila.updated_at === null ? 'is.null' : 'eq.' + fila.updated_at);
    const result = await fetch(url, { method: 'PATCH', headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify({ updated_at: fecha, canvas_ui: { ...fila.canvas_ui, publication: {
        ...publicacion, stage, progress: Math.round(ficha.avance_fisico_pct), investorNotes: nota, milestones, simulation,
      } } }),
    });
    if (!result.ok) throw new Error('actualización');
    const cambiadas = await result.json();
    if (cambiadas.length !== 1) return Response.json({ error: 'Estado concurrente; reintentar' }, { status: 503 });
    return Response.json({ actualizado: true, dia: body.dia, corrida });
  } catch (error) {
    console.error('No se sincronizó la ficha', error instanceof Error ? error.message : 'Error inesperado');
    return Response.json({ error: 'No se pudo sincronizar la ficha' }, { status: 503 });
  }
});
