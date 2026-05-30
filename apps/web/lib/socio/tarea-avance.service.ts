import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { evidenciaPublicUrl } from '@/lib/cliente/evidencia-display';

export type TareaAvanceEvidenciasResult = {
  avanceDiario: number;
  evidenciasFinales: string[];
};

export class TareaAvanceService {
  static async obtenerAvanceYEvidencias(tareaId: string): Promise<TareaAvanceEvidenciasResult> {
    const supabaseAny = createServiceSupabaseClient() as any;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const hoyISO = hoy.toISOString();

    let avanceDiario = 0;

    const { data: eventosAvance } = await supabaseAny
      .from('eventos')
      .select('id, snapshot_json')
      .eq('tarea_id', tareaId)
      .in('nuevo_estado', ['en_progreso', 'en_ejecucion'])
      .gte('created_at', hoyISO)
      .order('created_at', { ascending: false })
      .limit(1);

    if (eventosAvance?.length) {
      const snapshot = eventosAvance[0].snapshot_json as { avance_diario?: number } | null;
      if (snapshot?.avance_diario !== undefined) {
        avanceDiario = Number(snapshot.avance_diario) || 0;
      }
    }

    const evidenciasFinales: string[] = [];
    const { data: candidatosEv } = await supabaseAny
      .from('eventos')
      .select('id, nuevo_estado')
      .eq('tarea_id', tareaId)
      .order('created_at', { ascending: false })
      .limit(24);

    const oficialOk = new Set(['validada', 'para_validar', 'en_progreso', 'en_ejecucion']);
    const legacyOk = new Set(['finalizado', 'finalizada']);
    const pick = (candidatosEv ?? []).find((ev: { nuevo_estado?: string | null }) => {
      const n = (ev.nuevo_estado || '').toLowerCase();
      return oficialOk.has(n) || legacyOk.has(n);
    });

    if (pick?.id) {
      const { data: mediaData } = await supabaseAny
        .from('media')
        .select('path, kind')
        .eq('evento_id', pick.id)
        .eq('kind', 'evidencia_final');

      for (const m of mediaData ?? []) {
        const url = evidenciaPublicUrl(m.path as string);
        if (url) evidenciasFinales.push(url);
      }
    }

    return { avanceDiario, evidenciasFinales };
  }
}
