// @ts-nocheck
/**
 * Script para generar tareas desde elementos existentes
 * 
 * Uso:
 *   ts-node scripts/seed-tareas-desde-elementos.ts ORG_ID [OBRA_ID]
 * 
 * Si no se proporciona OBRA_ID, procesa todas las obras de la organización
 */

import 'dotenv/config';
import { createServiceSupabaseClient } from '../lib/supabase-server';
import { ExpansorElementos } from '../lib/services/expansorElementos';

const ORG_ID = process.env.ORG_ID || process.argv[2];
const OBRA_ID = process.argv[3] || undefined;

if (!ORG_ID) {
  console.error('❌ Error: ORG_ID es requerido');
  console.error('   Uso: ts-node scripts/seed-tareas-desde-elementos.ts ORG_ID [OBRA_ID]');
  console.error('   O define ORG_ID en .env.local');
  process.exit(1);
}

async function main() {
  console.log('🚀 Iniciando generación de tareas desde elementos...\n');
  console.log(`📋 Organización: ${ORG_ID}`);
  if (OBRA_ID) {
    console.log(`🏗️  Obra específica: ${OBRA_ID}`);
  } else {
    console.log('🏗️  Todas las obras de la organización');
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

    let totalTareasNuevas = 0;
    let totalElementosProcesados = 0;

    // Procesar cada obra
    for (const obra of obras) {
      console.log(`\n📦 Procesando obra: ${obra.name} (${obra.id})`);

      // Obtener elementos de la obra
      const { data: elementos, error: elementosError } = await supabase
        .from('elementos')
        .select('id, obra_id, org_id, nombre, categoria, cantidad, unidad')
        .eq('obra_id', obra.id);

      if (elementosError) {
        console.error(`  ❌ Error obteniendo elementos:`, elementosError);
        continue;
      }

      if (!elementos || elementos.length === 0) {
        console.log(`  ⚠️  No hay elementos en esta obra`);
        continue;
      }

      console.log(`  📋 ${elementos.length} elemento(s) encontrado(s)`);

      // Procesar cada elemento
      for (const elemento of elementos) {
        totalElementosProcesados++;

        try {
          // Verificar si ya existen tareas para este elemento
          const { data: tareasExistentes } = await supabase
            .from('tareas')
            .select('id, title')
            .eq('elemento_id', elemento.id);

          const titulosExistentes = new Set(tareasExistentes?.map(t => t.title) || []);

          // Preparar elemento para el expansor
          const elementoParaExpansor = {
            id: elemento.id,
            categoria: elemento.categoria || '',
            tipo: elemento.nombre || '',
            cantidad: elemento.cantidad || 1,
            unidad: (elemento.unidad || 'unidad') as 'm²' | 'm³' | 'unidad',
          };

          // Generar tareas
          const tareasGeneradas = ExpansorElementos.expandirElementos([elementoParaExpansor]);

          if (tareasGeneradas.length === 0) {
            console.log(`    ⚠️  ${elemento.nombre}: No se generaron tareas`);
            continue;
          }

          // Filtrar tareas que no existen
          const tareasNuevas = tareasGeneradas.filter(t => !titulosExistentes.has(t.nombre));

          if (tareasNuevas.length === 0) {
            console.log(`    ✅ ${elemento.nombre}: Ya tiene todas las tareas (${tareasGeneradas.length})`);
            continue;
          }

          // Calcular fechas estimadas
          const fechaInicio = new Date();
          const tareasInsert = tareasNuevas.map((t, index) => {
            const fechaInicioEstimada = new Date(fechaInicio);
            fechaInicioEstimada.setDate(fechaInicioEstimada.getDate() + index * t.tiempoEstimado);
            const fechaFinEstimada = new Date(fechaInicioEstimada);
            fechaFinEstimada.setDate(fechaFinEstimada.getDate() + t.tiempoEstimado);

            return {
              org_id: elemento.org_id,
              obra_id: elemento.obra_id,
              elemento_id: elemento.id,
              title: t.nombre,
              descripcion: `${t.nombre} para ${elemento.nombre}`,
              estado: 'pendiente',
              prioridad: 'MEDIA',
              avance: 0,
              fecha_inicio_estimada: fechaInicioEstimada.toISOString(),
              fecha_fin_estimada: fechaFinEstimada.toISOString(),
            };
          });

          // Insertar tareas
          const { error: insertError } = await supabase
            .from('tareas')
            .insert(tareasInsert);

          if (insertError) {
            console.error(`    ❌ ${elemento.nombre}: Error insertando tareas:`, insertError.message);
            continue;
          }

          console.log(`    ✅ ${elemento.nombre}: ${tareasNuevas.length} tarea(s) nueva(s) generada(s) (${tareasGeneradas.length} total)`);
          totalTareasNuevas += tareasNuevas.length;

        } catch (error) {
          console.error(`    ❌ ${elemento.nombre}: Error procesando:`, error instanceof Error ? error.message : error);
          continue;
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN');
    console.log('='.repeat(50));
    console.log(`✅ Elementos procesados: ${totalElementosProcesados}`);
    console.log(`✅ Tareas nuevas generadas: ${totalTareasNuevas}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

main().catch(console.error);

