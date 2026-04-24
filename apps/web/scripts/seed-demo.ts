/**
 * Seed DEMO para video GROWS MVP 1.0
 * - Idempotente: se puede ejecutar varias veces sin duplicar datos.
 * - Usa SUPABASE_SERVICE_ROLE_KEY (server-side).
 * - FSM: tareas.estado pendiente|en_progreso|para_validar|validada|rechazada
 *        tareas_subtareas.estado pendiente|en_progreso|para_validar|validado|rechazado
 *
 * Uso:
 *   pnpm run seed:demo              → crea org/socios/obras/tareas/presupuestos
 *   pnpm run seed:demo -- --approve <obraId> <socioId>  → aprueba todo para ese socio en la obra
 */

import path from 'path';
import { config } from 'dotenv';

config();
config({ path: path.resolve(process.cwd(), '.env.local') });
import { createServiceSupabaseClient } from '../lib/supabase-server';
import type { Database } from '../lib/types/supabase.gen';

const DEMO_OBRA_A_NAME = 'Demo Casa Fisherton';
const DEMO_OBRA_B_NAME = 'Demo Condominio Pueblo Esther';
const DEMO_SOCIO_EMAILS = [
  'demo.socio1@grows.app',
  'demo.socio2@grows.app',
  'demo.socio3@grows.app',
  'demo.socio4@grows.app',
  'demo.socio5@grows.app',
];

const TAREAS_OBRA_A = [
  'Replanteo',
  'Excavación',
  'Cimientos',
  'Encadenado',
  'Mampostería PB',
  'Losa PB',
  'Mampostería P1',
  'Losa P1',
  'Revoque grueso',
  'Revoque fino',
  'Instalación eléctrica',
  'Instalación sanitaria',
  'Pintura interior',
  'Pintura exterior',
  'Cielorrasos',
  'Aberturas',
  'Pisos',
  'Revestimientos',
  'Carpintería',
  'Impermeabilización',
  'Cerco perimetral',
  'Contrapisos',
  'Instalación gas',
  'Terminaciones baño',
  'Terminaciones cocina',
  'Iluminación',
  'Cloaca',
  'Pavimento',
  'Landscaping',
  'Limpieza final',
];

const TAREAS_OBRA_B = [
  'Replanteo y nivelación',
  'Excavación general',
  'Hormigón de cimientos',
  'Encadenado inferior',
  'Mampostería planta baja',
  'Losa alivianada PB',
  'Columnas y vigas',
  'Mampostería primer piso',
  'Losa primer piso',
  'Estructura segundo piso',
  'Revoque interior',
  'Revoque exterior',
  'Instalación eléctrica completa',
  'Instalación sanitaria',
  'Pintura',
  'Cielorrasos de yeso',
  'Carpintería de aluminio',
  'Pisos cerámicos',
  'Revestimientos',
  'Impermeabilización cubierta',
  'Ascensores (preinstalación)',
  'Gas y calefacción',
  'Terminaciones',
  'Instalación de artefactos',
  'Señalización',
  'Cerco y portón',
  'Pavimento acceso',
  'Espacios verdes',
  'Seguridad perimetral',
  'Entrega y acta',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomMonto(): number {
  return randomInt(150000, 900000);
}

function logError(table: string, context: string, payload: unknown, err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[SEED DEMO] Constraint/error en ${table} (${context}):`, msg);
  console.error('  Payload mínimo:', JSON.stringify(payload, null, 2));
}

async function getOrCreateOrgId(supabase: ReturnType<typeof createServiceSupabaseClient>): Promise<string> {
  const { data: orgs, error } = await supabase.from('organizations').select('id').limit(1);
  if (error) {
    console.error('[SEED DEMO] Error obteniendo organización:', error.message);
    throw new Error(`No se pudo obtener org: ${error.message}`);
  }
  if (orgs && orgs.length > 0) {
    return orgs[0].id;
  }
  const newId = crypto.randomUUID();
  const { error: insertError } = await supabase.from('organizations').insert({
    id: newId,
    name: 'Demo GROWS Video',
    plan_actual: 'free',
  });
  if (insertError) {
    throw new Error(`No se pudo crear organización demo: ${insertError.message}`);
  }
  console.log('[SEED DEMO] Organización demo creada:', newId);
  return newId;
}

async function ensureSocios(orgId: string, supabase: ReturnType<typeof createServiceSupabaseClient>): Promise<string[]> {
  const ids: string[] = [];
  const especialidades = ['Albañilería', 'Electricidad', 'Sanitaria', 'Pintura', 'Herrería'];
  for (let i = 0; i < DEMO_SOCIO_EMAILS.length; i++) {
    const email = DEMO_SOCIO_EMAILS[i];
    const { data: existing } = await supabase.from('socios').select('id').eq('org_id', orgId).eq('email', email).maybeSingle();
    if (existing) {
      ids.push(existing.id);
      continue;
    }
    const id = crypto.randomUUID();
    const { error } = await supabase.from('socios').insert({
      id,
      org_id: orgId,
      email,
      nombre: `Demo Socio ${i + 1}`,
      telefono: `+54 341 ${randomInt(4000000, 4999999)}`,
      especialidad: especialidades[i % especialidades.length],
      estado: 'ACTIVO',
    });
    if (error) {
      logError('socios', `email=${email}`, { org_id: orgId, email }, error);
      throw error;
    }
    ids.push(id);
  }
  return ids;
}

async function ensureObras(
  orgId: string,
  supabase: ReturnType<typeof createServiceSupabaseClient>
): Promise<{ idA: string; idB: string }> {
  const now = new Date().toISOString();
  let idA = '';
  let idB = '';

  const { data: existingA } = await supabase.from('obras').select('id').eq('org_id', orgId).eq('name', DEMO_OBRA_A_NAME).maybeSingle();
  if (existingA) {
    idA = existingA.id;
  } else {
    idA = crypto.randomUUID();
    const { error } = await supabase.from('obras').insert({
      id: idA,
      org_id: orgId,
      name: DEMO_OBRA_A_NAME,
      address: 'Fisherton, Rosario, Santa Fe',
      latitud: -32.95,
      longitud: -60.69,
      tipo_obra: 'nueva',
      propietario: 'Cliente Demo',
      estado: 'ACTIVA',
      created_at: now,
      updated_at: now,
    });
    if (error) {
      logError('obras', DEMO_OBRA_A_NAME, { name: DEMO_OBRA_A_NAME, org_id: orgId }, error);
      throw error;
    }
  }

  const { data: existingB } = await supabase.from('obras').select('id').eq('org_id', orgId).eq('name', DEMO_OBRA_B_NAME).maybeSingle();
  if (existingB) {
    idB = existingB.id;
  } else {
    idB = crypto.randomUUID();
    const { error } = await supabase.from('obras').insert({
      id: idB,
      org_id: orgId,
      name: DEMO_OBRA_B_NAME,
      address: 'Pueblo Esther, Santa Fe',
      latitud: -33.09,
      longitud: -60.88,
      tipo_obra: 'nueva',
      propietario: 'Cliente Demo',
      estado: 'ACTIVA',
      created_at: now,
      updated_at: now,
    });
    if (error) {
      logError('obras', DEMO_OBRA_B_NAME, { name: DEMO_OBRA_B_NAME, org_id: orgId }, error);
      throw error;
    }
  }
  return { idA, idB };
}

async function ensureTareas(
  orgId: string,
  obraId: string,
  titles: string[],
  supabase: ReturnType<typeof createServiceSupabaseClient>
): Promise<string[]> {
  const ids: string[] = [];
  const now = new Date().toISOString();
  for (const title of titles) {
    const { data: existing } = await supabase.from('tareas').select('id').eq('obra_id', obraId).eq('title', title).maybeSingle();
    if (existing) {
      ids.push(existing.id);
      continue;
    }
    const id = crypto.randomUUID();
    const { error } = await supabase.from('tareas').insert({
      id,
      org_id: orgId,
      obra_id: obraId,
      title,
      estado: 'pendiente',
      bloques_planificados: 1,
      dias_presupuesto: 1,
      created_at: now,
      updated_at: now,
    } as Database['public']['Tables']['tareas']['Insert']);
    if (error) {
      logError('tareas', `${obraId} / ${title}`, { obra_id: obraId, title }, error);
      throw error;
    }
    ids.push(id);
  }
  return ids;
}

async function ensurePresupuestos(
  tareaIds: string[],
  socioIds: string[],
  supabase: ReturnType<typeof createServiceSupabaseClient>
): Promise<number> {
  let created = 0;
  const now = new Date().toISOString();
  const supabaseAny = supabase as any;
  for (const tareaId of tareaIds) {
    for (const socioId of socioIds) {
      const { data: existing } = await supabase
        .from('tareas_presupuestos')
        .select('id')
        .eq('tarea_id', tareaId)
        .eq('socio_id', socioId)
        .maybeSingle();
      if (existing) continue;
      const diasReales = randomInt(1, 5);
      const monto = randomMonto();
      const { error } = await supabaseAny.from('tareas_presupuestos').insert({
        tarea_id: tareaId,
        socio_id: socioId,
        estado: 'ENVIADO',
        monto,
        dias_reales: diasReales,
        cantidad: 1,
        unidad: 'unidades',
        notas: `Presupuesto demo ${diasReales} días`,
        created_at: now,
        updated_at: now,
      });
      if (error) {
        logError('tareas_presupuestos', `tarea=${tareaId} socio=${socioId}`, { tarea_id: tareaId, socio_id: socioId }, error);
        throw error;
      }
      created++;
    }
  }
  return created;
}

/** Aprueba todos los presupuestos de un socio en una obra: APROBADO para ese socio, RECHAZADO resto; actualiza tareas y crea bloques (subtareas). */
export async function approveDemo(
  obraId: string,
  socioId: string,
  supabase: ReturnType<typeof createServiceSupabaseClient>
): Promise<{ tareasUpdated: number; subtareasCreated: number }> {
  const supabaseAny = supabase as any;
  const { data: tareas, error: tareasError } = await supabase
    .from('tareas')
    .select('id, org_id')
    .eq('obra_id', obraId);
  if (tareasError || !tareas?.length) {
    throw new Error(tareasError?.message ?? 'No hay tareas en la obra');
  }
  const orgId = tareas[0].org_id;
  let tareasUpdated = 0;
  let subtareasCreated = 0;
  const now = new Date().toISOString();

  for (const tarea of tareas) {
    const { data: presupuestos } = await supabase
      .from('tareas_presupuestos')
      .select('id, socio_id, dias_reales, monto')
      .eq('tarea_id', tarea.id);
    const approved = presupuestos?.find((p) => p.socio_id === socioId);
    if (!approved) continue;
    const diasReales = Math.max(1, approved.dias_reales ?? 1);
    const monto = approved.monto ?? 0;
    const montoPorDia = diasReales > 0 ? Math.round((monto / diasReales) * 100) / 100 : monto;

    await supabaseAny
      .from('tareas_presupuestos')
      .update({ estado: 'APROBADO', updated_at: now })
      .eq('id', approved.id);
    await supabaseAny
      .from('tareas_presupuestos')
      .update({ estado: 'RECHAZADO', updated_at: now })
      .eq('tarea_id', tarea.id)
      .neq('socio_id', socioId);

    const { error: updateTarea } = await supabaseAny
      .from('tareas')
      .update({
        responsable_socio_id: socioId,
        dias_presupuesto: diasReales,
        bloques_planificados: diasReales,
        updated_at: now,
      })
      .eq('id', tarea.id);
    if (updateTarea) {
      logError('tareas', `update tarea ${tarea.id}`, { dias_presupuesto: diasReales }, updateTarea);
      continue;
    }
    tareasUpdated++;

    const { data: existingSubtareas } = await supabase
      .from('tareas_subtareas')
      .select('id')
      .eq('tarea_id', tarea.id)
      .limit(1);
    if (existingSubtareas?.length) continue;

    const bloques = Array.from({ length: diasReales }, (_, i) => ({
      tarea_id: tarea.id,
      bloque_index: i + 1,
      orden: i + 1,
      cantidad: 1,
      unidad: 'unidades',
      estado: 'pendiente',
      evidencia_obligatoria: true,
      evidencia_cargada: false,
      socio_id: socioId,
      presupuesto_id: approved.id,
      created_at: now,
      updated_at: now,
      monto_estimado: montoPorDia,
    }));
    const { error: insertSub } = await supabaseAny.from('tareas_subtareas').insert(bloques);
    if (insertSub) {
      logError('tareas_subtareas', `tarea ${tarea.id}`, { count: bloques.length }, insertSub);
      continue;
    }
    subtareasCreated += bloques.length;
  }
  return { tareasUpdated, subtareasCreated };
}

async function runValidation(
  orgId: string,
  obraIds: { idA: string; idB: string },
  supabase: ReturnType<typeof createServiceSupabaseClient>
): Promise<void> {
  const { data: tareasA } = await supabase.from('tareas').select('id').eq('obra_id', obraIds.idA);
  const { data: tareasB } = await supabase.from('tareas').select('id').eq('obra_id', obraIds.idB);
  const tareaIds = [...(tareasA ?? []).map((t) => t.id), ...(tareasB ?? []).map((t) => t.id)];
  let presupuestosPerTarea: number[] = [];
  if (tareaIds.length > 0) {
    const { data: presupuestos } = await supabase.from('tareas_presupuestos').select('tarea_id').in('tarea_id', tareaIds);
    const byTarea = (presupuestos ?? []).reduce<Record<string, number>>((acc, p) => {
      acc[p.tarea_id] = (acc[p.tarea_id] ?? 0) + 1;
      return acc;
    }, {});
    presupuestosPerTarea = Object.values(byTarea);
  }
  console.log('\n--- Validación final ---');
  console.log('Obras demo en org: 2');
  console.log('Tareas obra A (esperado 30):', tareasA?.length ?? 0);
  console.log('Tareas obra B (esperado 30):', tareasB?.length ?? 0);
  console.log('Presupuestos por tarea (esperado 5):', presupuestosPerTarea.length ? `${Math.min(...presupuestosPerTarea)} - ${Math.max(...presupuestosPerTarea)}` : 'N/A');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const approveIdx = args.indexOf('--approve');
  const doApprove = approveIdx !== -1;
  const obraId = doApprove ? args[approveIdx + 1] : null;
  const socioId = doApprove ? args[approveIdx + 2] : null;

  if (doApprove && (!obraId || !socioId)) {
    console.error('Uso con aprobación: pnpm run seed:demo -- --approve <obraId> <socioId>');
    process.exit(1);
  }

  console.log('[SEED DEMO] Iniciando...');
  const supabase = createServiceSupabaseClient();

  try {
    const orgId = await getOrCreateOrgId(supabase);
    const socioIds = await ensureSocios(orgId, supabase);
    const { idA, idB } = await ensureObras(orgId, supabase);
    const tareasA = await ensureTareas(orgId, idA, TAREAS_OBRA_A, supabase);
    const tareasB = await ensureTareas(orgId, idB, TAREAS_OBRA_B, supabase);
    const presupuestosCreated = await ensurePresupuestos([...tareasA, ...tareasB], socioIds, supabase);

    if (doApprove && obraId && socioId) {
      const { tareasUpdated, subtareasCreated } = await approveDemo(obraId, socioId, supabase);
      console.log('[SEED DEMO] Aprobación:', { tareasUpdated, subtareasCreated });
    }

    await runValidation(orgId, { idA: idA, idB: idB }, supabase);

    console.log('\n--- Resumen ---');
    console.log('org_id:', orgId);
    console.log('obra_id A:', idA);
    console.log('obra_id B:', idB);
    console.log('tareas creadas (A):', tareasA.length);
    console.log('tareas creadas (B):', tareasB.length);
    console.log('socios demo:', socioIds.length);
    console.log('presupuestos insertados en esta ejecución:', presupuestosCreated);
    console.log('\n[SEED DEMO] Listo.');
  } catch (e) {
    console.error('[SEED DEMO] Error:', e);
    process.exit(1);
  }
}

main();
