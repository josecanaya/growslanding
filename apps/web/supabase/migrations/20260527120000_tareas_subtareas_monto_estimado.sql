-- Columnas de billetera en bloques (legacy en migrations/ sin aplicar en prod).

ALTER TABLE public.tareas_subtareas
  ADD COLUMN IF NOT EXISTS monto_estimado numeric,
  ADD COLUMN IF NOT EXISTS monto_validado numeric,
  ADD COLUMN IF NOT EXISTS fecha_validacion timestamptz,
  ADD COLUMN IF NOT EXISTS validado_por uuid;

UPDATE public.tareas_subtareas ts
SET monto_estimado = COALESCE(
  ts.monto_estimado,
  (
    SELECT ROUND(
      COALESCE(tp.monto, 0) / GREATEST(COALESCE(t.bloques_planificados, t.dias_presupuesto, 1), 1)::numeric,
      2
    )
    FROM public.tareas t
    LEFT JOIN public.tareas_presupuestos tp
      ON tp.id = ts.presupuesto_id OR (ts.presupuesto_id IS NULL AND tp.tarea_id = ts.tarea_id)
    WHERE t.id = ts.tarea_id
    ORDER BY tp.created_at DESC NULLS LAST
    LIMIT 1
  ),
  1
)
WHERE ts.monto_estimado IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tareas_subtareas_monto_not_null'
  ) THEN
    ALTER TABLE public.tareas_subtareas
      ADD CONSTRAINT tareas_subtareas_monto_not_null CHECK (monto_estimado IS NOT NULL);
  END IF;
END $$;

-- PostgREST: recargar schema cache (Supabase lo hace tras migraciones vía dashboard/CLI).
