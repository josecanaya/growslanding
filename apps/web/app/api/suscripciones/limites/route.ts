import { NextRequest, NextResponse } from 'next/server';
import { obtenerConfigPlan, validarLimiteObras, obtenerCostoObrasExtras } from '../../../../lib/services/plan.service';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const organizacionId = request.headers.get('x-organizacion-id');
    
    if (!organizacionId) {
      return NextResponse.json(
        { success: false, error: 'Organización requerida' },
        { status: 400 }
      );
    }

    // Obtener configuración del plan
    const planConfig = await obtenerConfigPlan(organizacionId);
    
    // Validar límites de obras
    const validacionObras = await validarLimiteObras(organizacionId);
    
    // Obtener costo de obras extras (solo para ENTERPRISE)
    const obrasExtras = await obtenerCostoObrasExtras(organizacionId);

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    // Obtener estadísticas de uso
    const { count: obrasActivas } = await supabaseAny
      .from('obras')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', organizacionId)
      .eq('estado', 'ACTIVA');

    const { count: obrasTotal } = await supabaseAny
      .from('obras')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', organizacionId);

    // Contar socios activos (si existe la tabla)
    let sociosActivos = 0;
    try {
      const { count } = await supabaseAny
        .from('socios')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', organizacionId);
      sociosActivos = count || 0;
    } catch (error) {
      // Tabla puede no existir, ignorar
      console.warn('[limites] No se pudo contar socios:', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        plan: {
          tipo: planConfig.plan,
          costoMensual: planConfig.costoMensual,
          limiteObras: planConfig.limiteObras,
          costoObraExtra: planConfig.costoObraExtra,
        },
        limites: {
          obras: {
            activas: validacionObras.obrasActivas,
            maximo: planConfig.limiteObras,
            puedeCrear: validacionObras.puedeCrear,
            porcentaje: planConfig.limiteObras > 0 
              ? Math.round((validacionObras.obrasActivas / planConfig.limiteObras) * 100)
              : 0,
            disponible: planConfig.limiteObras > validacionObras.obrasActivas
              ? planConfig.limiteObras - validacionObras.obrasActivas
              : 0,
          },
        },
        comisiones: {
          min: planConfig.comisionMin * 100,
          max: planConfig.comisionMax * 100,
          fija: planConfig.comisionFija ? planConfig.comisionFija * 100 : null,
        },
        obrasExtras: obrasExtras.tieneExtras ? {
          cantidad: obrasExtras.cantidadExtras,
          costoTotal: obrasExtras.costoTotal,
        } : null,
        estadisticas: {
          obras: {
            activas: validacionObras.obrasActivas,
            totales: obrasTotal || 0,
          },
          socios: {
            activos: sociosActivos,
          },
        },
      },
    });

  } catch (error) {
    console.error('Error en GET /api/suscripciones/limites:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}
