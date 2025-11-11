/**
 * Script para generar precedencias automáticas entre tareas
 * 
 * Uso:
 *   ts-node scripts/seed-precedencias-auto.ts ORG_ID [OBRA_ID] [--dry-run]
 * 
 * Si no se proporciona OBRA_ID, procesa todas las obras de la organización
 * Si se pasa --dry-run, solo muestra las precedencias que se crearían sin insertarlas
 */

// @ts-nocheck
import 'dotenv/config';
import { createServiceSupabaseClient } from '../lib/supabase-server';

const ORG_ID = process.env.ORG_ID || process.argv[2];
const OBRA_ID = process.argv[3] === '--dry-run' ? undefined : process.argv[3];
const DRY_RUN = process.argv.includes('--dry-run');

if (!ORG_ID) {
  console.error('❌ Error: ORG_ID es requerido');
  console.error('   Uso: ts-node scripts/seed-precedencias-auto.ts ORG_ID [OBRA_ID] [--dry-run]');
  console.error('   O define ORG_ID en .env.local');
  process.exit(1);
}

// Orden lógico de construcción (de más temprano a más tardío)
const ORDEN_BASE = [
  'Excavación',
  'Fundación',
  'Hormigón',
  'Columna',
  'Viga',
  'Losa',
  'Muro',
  'Mampostería',
  'Revoque',
  'Instalación eléctrica',
  'Instalación sanitaria',
  'Instalación gas',
  'Instalación pluvial',
  'Pintura',
  'Terminaciones',
  'Acabado',
];

interface TareaConOrden {
  id: string;
  title: string;
  elemento_id: string;
  orden: number; // Posición en el orden lógico
}

function encontrarOrdenTarea(title: string): number {
  const titleLower = title.toLowerCase();
  
  // Buscar la palabra clave que mejor coincida
  for (let i = 0; i < ORDEN_BASE.length; i++) {
    const keyword = ORDEN_BASE[i].toLowerCase();
    if (titleLower.includes(keyword)) {
      return i;
    }
  }
  
  return -1; // No encontrado
}

async function main() {
  console.log('🚀 Iniciando generación de precedencias automáticas...\n');
  console.log(`📋 Organización: ${ORG_ID}`);
  if (OBRA_ID) {
    console.log(`🏗️  Obra específica: ${OBRA_ID}`);
  } else {
    console.log('🏗️  Todas las obras de la organización');
  }
  if (DRY_RUN) {
    console.log('🔍 Modo DRY-RUN: solo se mostrarán las precedencias, no se insertarán');
  }
  console.log('');

  const supabase = createServiceSupabaseClient();

  try {
    // Obtener obras
    let obrasQuery = supabase
      .from('obras')
      .select('id, name, org_id')
      .eq('org_id', ORG_ID);

    if (OBRA_ID) {
      obrasQuery = obrasQuery.eq('id', OBRA_ID);
    }

    const { data: obras, error: obrasError } = await obrasQuery;

    if (obrasError) {
      console.error('❌ Error obteniendo obras:', obrasError);
      process.exit(1);
    }

    if (!obras || obras.length === 0) {
      console.log('⚠️  No se encontraron obras');
      process.exit(0);
    }

    console.log(`✅ ${obras.length} obra(s) encontrada(s)\n`);

    let totalPrecedenciasNuevas = 0;
    let totalPrecedenciasExistentes = 0;
    let totalObrasProcesadas = 0;

    // Procesar cada obra
    for (const obra of obras) {
      console.log(`\n📦 Procesando obra: ${obra.name} (${obra.id})`);

      // Obtener todas las tareas de la obra
      const { data: tareas, error: tareasError } = await supabase
        .from('tareas')
        .select('id, title, elemento_id, obra_id')
        .eq('obra_id', obra.id)
        .eq('org_id', ORG_ID);

      if (tareasError) {
        console.error(`  ❌ Error obteniendo tareas:`, tareasError);
        continue;
      }

      if (!tareas || tareas.length === 0) {
        console.log(`  ⚠️  No hay tareas en esta obra`);
        continue;
      }

      console.log(`  📋 ${tareas.length} tarea(s) encontrada(s)`);

      // Filtrar tareas que tienen un orden válido
      const tareasConOrden: TareaConOrden[] = tareas
        .map(tarea => ({
          id: tarea.id,
          title: tarea.title || '',
          elemento_id: tarea.elemento_id || '',
          orden: encontrarOrdenTarea(tarea.title || ''),
        }))
        .filter(t => t.orden >= 0) // Solo tareas con orden válido
        .sort((a, b) => a.orden - b.orden); // Ordenar por orden lógico

      if (tareasConOrden.length === 0) {
        console.log(`  ⚠️  No se encontraron tareas con orden válido`);
        continue;
      }

      console.log(`  ✅ ${tareasConOrden.length} tarea(s) con orden válido`);

      // Obtener precedencias existentes
      const tareaIds = tareasConOrden.map(t => t.id);
      const { data: precedenciasExistentes, error: precError } = await supabase
        .from('tarea_precedencias')
        .select('tarea_id, depende_de')
        .in('tarea_id', tareaIds);

      if (precError) {
        console.error(`  ❌ Error obteniendo precedencias:`, precError);
        // Continuar aunque falle, asumimos que no hay precedencias
      }

      const precedenciasSet = new Set<string>();
      (precedenciasExistentes || []).forEach(prec => {
        precedenciasSet.add(`${prec.tarea_id}-${prec.depende_de}`);
      });

      // Generar precedencias entre tareas consecutivas
      const precedenciasNuevas: Array<{
        tarea_id: string;
        depende_de: string;
        tipo_dependencia: string;
        lag_dias: number;
      }> = [];

      for (let i = 1; i < tareasConOrden.length; i++) {
        const tareaActual = tareasConOrden[i];
        const tareaAnterior = tareasConOrden[i - 1];

        // Verificar si ya existe esta precedencia
        const clave = `${tareaActual.id}-${tareaAnterior.id}`;
        if (precedenciasSet.has(clave)) {
          continue; // Ya existe, saltar
        }

        // Solo crear precedencia si tienen orden diferente
        // (si tienen el mismo orden, no son consecutivas en el flujo)
        if (tareaActual.orden > tareaAnterior.orden) {
          precedenciasNuevas.push({
            tarea_id: tareaActual.id,
            depende_de: tareaAnterior.id,
            tipo_dependencia: 'FINISH_TO_START',
            lag_dias: 0,
          });
        }
      }

      if (precedenciasNuevas.length === 0) {
        console.log(`  ✅ No hay precedencias nuevas para crear`);
        totalPrecedenciasExistentes += precedenciasSet.size;
        continue;
      }

      console.log(`  📝 ${precedenciasNuevas.length} precedencia(s) nueva(s) a crear`);
      console.log(`  📋 ${precedenciasSet.size} precedencia(s) ya existente(s)`);

      // Mostrar las precedencias que se crearían
      if (DRY_RUN || precedenciasNuevas.length <= 10) {
        console.log(`\n  📋 Precedencias a crear:`);
        precedenciasNuevas.forEach(prec => {
          const tareaActual = tareasConOrden.find(t => t.id === prec.tarea_id);
          const tareaAnterior = tareasConOrden.find(t => t.id === prec.depende_de);
          console.log(`    • "${tareaActual?.title || prec.tarea_id}" → depende de "${tareaAnterior?.title || prec.depende_de}"`);
        });
      } else {
        console.log(`  📋 (Mostrando primeras 5 de ${precedenciasNuevas.length})`);
        precedenciasNuevas.slice(0, 5).forEach(prec => {
          const tareaActual = tareasConOrden.find(t => t.id === prec.tarea_id);
          const tareaAnterior = tareasConOrden.find(t => t.id === prec.depende_de);
          console.log(`    • "${tareaActual?.title || prec.tarea_id}" → depende de "${tareaAnterior?.title || prec.depende_de}"`);
        });
      }

      // Insertar precedencias si no es dry-run
      if (!DRY_RUN) {
        const { error: insertError } = await supabase
          .from('tarea_precedencias')
          .insert(precedenciasNuevas);

        if (insertError) {
          console.error(`  ❌ Error insertando precedencias:`, insertError);
          continue;
        }

        console.log(`  ✅ ${precedenciasNuevas.length} precedencia(s) insertada(s)`);
      } else {
        console.log(`  🔍 [DRY-RUN] No se insertaron precedencias`);
      }

      totalPrecedenciasNuevas += precedenciasNuevas.length;
      totalPrecedenciasExistentes += precedenciasSet.size;
      totalObrasProcesadas++;

      console.log(`  📊 Obra: ${obra.id} — Precedencias nuevas: ${precedenciasNuevas.length} — Existentes: ${precedenciasSet.size} — Total: ${precedenciasNuevas.length + precedenciasSet.size}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN');
    console.log('='.repeat(50));
    console.log(`✅ Obras procesadas: ${totalObrasProcesadas}`);
    console.log(`✅ Precedencias nuevas: ${totalPrecedenciasNuevas}`);
    console.log(`✅ Precedencias existentes: ${totalPrecedenciasExistentes}`);
    console.log(`✅ Total precedencias: ${totalPrecedenciasNuevas + totalPrecedenciasExistentes}`);
    if (DRY_RUN) {
      console.log(`\n🔍 Modo DRY-RUN: No se insertaron precedencias`);
    }
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

main().catch(console.error);

