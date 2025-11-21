'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface PresupuestoItem {
  id: string;
  tarea_id: string;
  estado: string;
  dias_reales: number | null;
  monto: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  tarea: {
    id: string;
    title: string | null;
    etapa: string | null;
    duracion_sugerida: number | null;
  } | null;
  elemento: {
    nombre: string | null;
    planta: string | null;
    altura: string | null;
    cantidad: number | null;
    unidad: string | null;
  } | null;
}

interface Obra {
  id: string;
  name: string;
  direccion_completa?: string | null;
  cantidad_plantas?: number | null;
  superficie_por_planta?: number | null;
  coordenadas_lat?: number | null;
  coordenadas_lng?: number | null;
  cliente?: string | null;
  fecha_inicio?: string | null;
  [key: string]: any; // Para permitir campos adicionales del API
}

interface UsePresupuestosReturn {
  obra: Obra | null;
  presupuestos: PresupuestoItem[];
  editing: Map<string, { dias_reales: number | null; monto: number | null }>;
  loading: boolean;
  saving: boolean;
  onFieldChange: (tareaId: string, field: 'dias_reales' | 'monto', value: number | null) => void;
  handleSaveDraft: (presupuestosFiltrados: PresupuestoItem[]) => Promise<void>;
  handleSendPresupuesto: (presupuestosFiltrados: PresupuestoItem[]) => Promise<void>;
}

export function usePresupuestos(obraId: string | null): UsePresupuestosReturn {
  const { toast } = useToast();
  const [obra, setObra] = useState<Obra | null>(null);
  const [presupuestos, setPresupuestos] = useState<PresupuestoItem[]>([]);
  const [editing, setEditing] = useState<Map<string, { dias_reales: number | null; monto: number | null }>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Sincronizar editing cuando cambian los presupuestos (solo en carga inicial)
  useEffect(() => {
    if (presupuestos.length === 0) return;
    
      const newEditing = new Map<string, { dias_reales: number | null; monto: number | null }>();
      presupuestos.forEach((p) => {
        const existing = editing.get(p.tarea_id);
        // Solo actualizar si no existe en editing (carga inicial)
        if (!existing) {
          // Precargar dias_reales con duracion_sugerida si dias_reales es null
          const diasIniciales = p.dias_reales !== null 
            ? p.dias_reales 
            : (p.tarea?.duracion_sugerida ?? null);
          
          newEditing.set(p.tarea_id, {
            dias_reales: diasIniciales,
            monto: p.monto,
          });
        } else {
          newEditing.set(p.tarea_id, existing);
        }
      });
    
    // Solo actualizar si hay cambios
    if (newEditing.size > 0 && Array.from(newEditing.keys()).some(k => !editing.has(k))) {
      setEditing((prev) => {
        const merged = new Map(prev);
        newEditing.forEach((value, key) => {
          if (!merged.has(key)) {
            merged.set(key, value);
          }
        });
        return merged;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presupuestos.length]);

  // Fetch inicial
  useEffect(() => {
    async function fetchPresupuestos() {
      if (!obraId) {
        console.log('[usePresupuestos] No hay obraId, deteniendo carga');
        setLoading(false);
        return;
      }

      console.log('[usePresupuestos] Iniciando carga para obraId:', obraId);
      setLoading(true);
      try {
        const response = await fetch(`/api/socio/presupuestos?obra_id=${obraId}`);
        console.log('[usePresupuestos] Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('[usePresupuestos] Error response:', errorData);
          throw new Error(errorData.message || 'Error al cargar presupuestos');
        }

        const data = await response.json();
        console.log('[usePresupuestos] Data recibida:', { 
          obra: !!data.obra, 
          presupuestosCount: data.presupuestos?.length || 0 
        });
        
        setObra(data.obra);
        setPresupuestos(data.presupuestos || []);

        // Inicializar estado de edición
        // Precargar dias_reales con duracion_sugerida si dias_reales es null
        const editingMap = new Map<string, { dias_reales: number | null; monto: number | null }>();
        (data.presupuestos || []).forEach((p: PresupuestoItem) => {
          // Si dias_reales es null pero hay duracion_sugerida, usar esa como valor inicial
          const diasIniciales = p.dias_reales !== null 
            ? p.dias_reales 
            : (p.tarea?.duracion_sugerida ?? null);
          
          editingMap.set(p.tarea_id, {
            dias_reales: diasIniciales,
            monto: p.monto,
          });
        });
        setEditing(editingMap);
      } catch (error) {
        console.error('[usePresupuestos] Error:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'No se pudieron cargar los presupuestos.',
          variant: 'destructive',
        });
        setObra(null);
        setPresupuestos([]);
      } finally {
        setLoading(false);
        console.log('[usePresupuestos] Loading finalizado');
      }
    }

    fetchPresupuestos();
  }, [obraId, toast]);

  const onFieldChange = useCallback((tareaId: string, field: 'dias_reales' | 'monto', value: number | null) => {
    setEditing((prev) => {
      const next = new Map(prev);
      const current = next.get(tareaId) || { dias_reales: null, monto: null };
      next.set(tareaId, { ...current, [field]: value });
      return next;
    });
  }, []);

  const handleSaveDraft = useCallback(async (presupuestosFiltrados: PresupuestoItem[]) => {
    if (!obraId) return;

    setSaving(true);
    try {
      const presupuestosToSave = presupuestosFiltrados.map((presupuesto) => {
        const editData = editing.get(presupuesto.tarea_id) || { dias_reales: null, monto: null };
        return {
          tarea_id: presupuesto.tarea_id,
          dias_reales: editData.dias_reales,
          monto: editData.monto,
          estado: presupuesto.estado === 'APROBADO' ? 'APROBADO' : 'PENDIENTE' as 'PENDIENTE' | 'ENVIADO',
        };
      });

      const response = await fetch('/api/socio/presupuestos/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          obra_id: obraId,
          presupuestos: presupuestosToSave,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al guardar');
      }

      toast({
        title: 'Borrador guardado',
        description: 'Los cambios se guardaron correctamente.',
      });

      // Recargar datos
      const responseReload = await fetch(`/api/socio/presupuestos?obra_id=${obraId}`);
      if (responseReload.ok) {
        const dataReload = await responseReload.json();
        setPresupuestos(dataReload.presupuestos || []);
        const editingMap = new Map<string, { dias_reales: number | null; monto: number | null }>();
        (dataReload.presupuestos || []).forEach((p: PresupuestoItem) => {
          // Precargar dias_reales con duracion_sugerida si dias_reales es null
          const diasIniciales = p.dias_reales !== null 
            ? p.dias_reales 
            : (p.tarea?.duracion_sugerida ?? null);
          
          editingMap.set(p.tarea_id, {
            dias_reales: diasIniciales,
            monto: p.monto,
          });
        });
        setEditing(editingMap);
      }
    } catch (error) {
      console.error('[usePresupuestos] Error guardando borrador:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo guardar el borrador.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [obraId, editing, toast]);

  const handleSendPresupuesto = useCallback(async (presupuestosFiltrados: PresupuestoItem[]) => {
    if (!obraId) return;

    setSaving(true);
    try {
      const presupuestosToSend = presupuestosFiltrados.map((presupuesto) => {
        const editData = editing.get(presupuesto.tarea_id) || { dias_reales: null, monto: null };
        return {
          tarea_id: presupuesto.tarea_id,
          dias_reales: editData.dias_reales,
          monto: editData.monto,
          estado: 'ENVIADO' as 'PENDIENTE' | 'ENVIADO',
        };
      });

      const response = await fetch('/api/socio/presupuestos/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          obra_id: obraId,
          presupuestos: presupuestosToSend,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al enviar');
      }

      toast({
        title: 'Presupuesto enviado',
        description: 'El presupuesto se envió correctamente al cliente.',
      });

      // Recargar datos
      const responseReload = await fetch(`/api/socio/presupuestos?obra_id=${obraId}`);
      if (responseReload.ok) {
        const dataReload = await responseReload.json();
        setPresupuestos(dataReload.presupuestos || []);
        const editingMap = new Map<string, { dias_reales: number | null; monto: number | null }>();
        (dataReload.presupuestos || []).forEach((p: PresupuestoItem) => {
          // Precargar dias_reales con duracion_sugerida si dias_reales es null
          const diasIniciales = p.dias_reales !== null 
            ? p.dias_reales 
            : (p.tarea?.duracion_sugerida ?? null);
          
          editingMap.set(p.tarea_id, {
            dias_reales: diasIniciales,
            monto: p.monto,
          });
        });
        setEditing(editingMap);
      }
    } catch (error) {
      console.error('[usePresupuestos] Error enviando presupuesto:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo enviar el presupuesto.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [obraId, editing, toast]);

  return {
    obra,
    presupuestos,
    editing,
    loading,
    saving,
    onFieldChange,
    handleSaveDraft,
    handleSendPresupuesto,
  };
}

