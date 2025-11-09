'use client';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/types/supabase.gen';

export type TareaResumen = {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: string | null;
  tipo: string | null;
  responsable: string | null;
  fecha_inicio_estimada: string | null;
  fecha_fin_estimada: string | null;
  fecha_completada: string | null;
  obra_id: string;
};

export type ObraResumen = {
  id: string;
  nombre: string;
  cliente: string | null;
  tipo_obra: string | null;
  fecha_inicio: string | null;
};

export async function fetchTareasPorObra(
  supabase: SupabaseClient<Database>,
  obraId: string,
  orgId?: string | null,
) {
  let request = supabase
    .from('tareas')
    .select('*')
    .eq('obra_id', obraId)
    .order('fecha_inicio_estimada', { ascending: true });

  if (orgId) {
    request = request.eq('org_id', orgId);
  }

  const { data: tareas, error } = await request;

  if (error) {
    throw error;
  }

  return (tareas ?? []).map((row) => ({
    id: row.id as string,
    titulo: (row as any).titulo ?? (row as any).title ?? 'Tarea sin título',
    descripcion: (row as any).descripcion ?? (row as any).description ?? null,
    estado: (row as any).estado ?? (row as any).status ?? null,
    tipo: (row as any).tipo ?? (row as any).category ?? null,
    responsable: (row as any).responsable ?? (row as any).assignee ?? null,
    fecha_inicio_estimada:
      (row as any).fecha_inicio_estimada ?? (row as any).fecha_inicio ?? null,
    fecha_fin_estimada:
      (row as any).fecha_fin_estimada ?? (row as any).fecha_fin ?? null,
    fecha_completada:
      (row as any).fecha_completada ?? (row as any).completed_at ?? null,
    obra_id: row.obra_id as string,
  })) as TareaResumen[];
}

export async function fetchObraResumen(
  supabase: SupabaseClient<Database>,
  obraId: string,
  orgId?: string | null,
): Promise<ObraResumen | null> {
  let request = supabase
    .from('obras')
    .select('id,name,propietario,tipo_obra,created_at')
    .eq('id', obraId);

  if (orgId) {
    request = request.eq('org_id', orgId);
  }

  const { data, error } = await request.maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    nombre: (data as any).name ?? 'Obra sin nombre',
    cliente: (data as any).propietario ?? null,
    tipo_obra: (data as any).tipo_obra ?? null,
    fecha_inicio: (data as any).created_at ?? null,
  };
}


