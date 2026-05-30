import { createServiceSupabaseClient } from '@/lib/supabase-server';

export type JornadaRow = {
  id: string;
  socio_id: string;
  obra_id: string;
  fecha: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  created_at?: string;
  updated_at?: string;
};

function sb() {
  return createServiceSupabaseClient() as any;
}

function fechaHoyIso(): string {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return hoy.toISOString().split('T')[0];
}

export class JornadasRepository {
  static fechaHoyIso = fechaHoyIso;

  static async findBySocioYFecha(socioId: string, fecha?: string): Promise<JornadaRow | null> {
    const f = fecha ?? fechaHoyIso();
    const { data, error } = await sb()
      .from('jornadas_socio')
      .select('*')
      .eq('socio_id', socioId)
      .eq('fecha', f)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as JornadaRow | null;
  }

  static async insert(params: {
    socio_id: string;
    obra_id: string;
    fecha: string;
    hora_inicio: string;
  }): Promise<JornadaRow> {
    const { data, error } = await sb()
      .from('jornadas_socio')
      .insert(params)
      .select('*')
      .single();
    if (error || !data) throw new Error(error?.message ?? 'No se pudo crear la jornada');
    return data as JornadaRow;
  }

  static async finalizar(id: string, socioId: string, horaFin: string): Promise<void> {
    const { error } = await sb()
      .from('jornadas_socio')
      .update({ hora_fin: horaFin, updated_at: horaFin })
      .eq('id', id)
      .eq('socio_id', socioId);
    if (error) throw new Error(error.message);
  }
}
