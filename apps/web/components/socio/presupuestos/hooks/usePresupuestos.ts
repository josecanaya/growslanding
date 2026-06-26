'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { generarPresupuestoPDF, generarPresupuestoPDFBytes } from '@/lib/pdf/generarPresupuestoPDF';
import {
  USE_MOCK_DATA,
  FORCE_PRESUPUESTOS_MOCK,
  MOCK_OBRA_PRESUPUESTO_DETALLE,
  MOCK_OBRAS_PARA_PRESUPUESTOS,
  MOCK_PRESUPUESTO_ITEMS,
} from '@/lib/mocks/socioMockData';
import type { DbCanvasNodeRow } from '@/lib/canvas/dbCanvasRowsToNodes';
import { presupuestoLineaTieneValoresObligatorios } from '@/lib/socio/presupuestoValores';

export type PresupuestoEditState = {
  dias_reales: number | null;
  monto: number | null;
  observacion: string;
  incluye_materiales: boolean;
};

export type CanvasBudgetGroupRow = { id: string; name: string; status?: string | null };

interface PresupuestoItem {
  id: string;
  tarea_id: string;
  estado: string;
  dias_reales: number | null;
  observacion?: string | null;
  incluye_materiales?: boolean | null;
  monto: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  tarea: {
    id: string;
    title: string | null;
    etapa: string | null;
    duracion_sugerida: number | null;
    canvas_node_id?: string | null;
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
  /** Nodos del canvas de la obra (jerarquía de presupuestos). */
  canvasNodes: DbCanvasNodeRow[];
  canvasBudgetGroups: CanvasBudgetGroupRow[];
  editing: Map<string, PresupuestoEditState>;
  loading: boolean;
  saving: boolean;
  pdfPath: string | null; // PDF path guardado en eventos
  onFieldChange: (
    tareaId: string,
    field: 'dias_reales' | 'monto' | 'observacion' | 'incluye_materiales',
    value: number | null | string | boolean,
  ) => void;
  handleSaveDraft: (presupuestosFiltrados: PresupuestoItem[]) => Promise<void>;
  handleSendPresupuesto: (presupuestosFiltrados: PresupuestoItem[], presupuestosAgrupadosPorEtapa: any, nombreContratista: string, etapaActiva?: 'ESTRUCTURA' | 'OBRA_GRIS' | 'TERMINACIONES') => Promise<void>;
  clearPdfPath: () => void; // Limpiar el pdfPath
}

export function usePresupuestos(obraId: string | null): UsePresupuestosReturn {
  const { toast } = useToast();
  const [obra, setObra] = useState<Obra | null>(null);
  const [presupuestos, setPresupuestos] = useState<PresupuestoItem[]>([]);
  const [canvasNodes, setCanvasNodes] = useState<DbCanvasNodeRow[]>([]);
  const [canvasBudgetGroups, setCanvasBudgetGroups] = useState<CanvasBudgetGroupRow[]>([]);
  const [editing, setEditing] = useState<Map<string, PresupuestoEditState>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pdfPath, setPdfPath] = useState<string | null>(null);

  const presupuestosUsanMock = USE_MOCK_DATA || FORCE_PRESUPUESTOS_MOCK;

  // Sincronizar editing cuando cambian los presupuestos (solo en carga inicial)
  useEffect(() => {
    if (presupuestos.length === 0) return;
    
      const newEditing = new Map<string, PresupuestoEditState>();
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
            observacion: p.observacion ?? '',
            incluye_materiales: p.incluye_materiales === true,
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

  // Fetch inicial (o mocks cuando USE_MOCK_DATA)
  useEffect(() => {
    async function fetchPresupuestos() {
      if (!obraId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      if (presupuestosUsanMock) {
        const obraEnLista = MOCK_OBRAS_PARA_PRESUPUESTOS.find((o) => o.obra_id === obraId);
        const obraMock: Obra = obraEnLista
          ? {
              id: obraId,
              name: obraEnLista.obra_name,
              direccion_completa: obraEnLista.direccion_completa ?? null,
              fecha_inicio: obraEnLista.fecha_inicio ?? null,
              cliente: 'Cliente demo',
            }
          : {
              ...MOCK_OBRA_PRESUPUESTO_DETALLE,
              id: obraId,
              name: MOCK_OBRA_PRESUPUESTO_DETALLE.name,
            };
        setObra(obraMock);
        const items = MOCK_PRESUPUESTO_ITEMS as PresupuestoItem[];
        setPresupuestos(items);
        setCanvasNodes([]);
        setCanvasBudgetGroups([]);
        const editingMap = new Map<string, PresupuestoEditState>();
        items.forEach((p: PresupuestoItem) => {
          editingMap.set(p.tarea_id, {
            dias_reales: p.dias_reales ?? p.tarea?.duracion_sugerida ?? null,
            monto: p.monto,
            observacion: p.observacion ?? '',
            incluye_materiales: p.incluye_materiales === true,
          });
        });
        setEditing(editingMap);
        setLoading(false);
        return;
      }

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
        setCanvasNodes((data.canvas_nodes || []) as DbCanvasNodeRow[]);
        setCanvasBudgetGroups((data.canvas_budget_groups || []) as CanvasBudgetGroupRow[]);

        // Inicializar estado de edición
        // Precargar dias_reales con duracion_sugerida si dias_reales es null
        const editingMap = new Map<string, PresupuestoEditState>();
        (data.presupuestos || []).forEach((p: PresupuestoItem) => {
          // Si dias_reales es null pero hay duracion_sugerida, usar esa como valor inicial
          const diasIniciales = p.dias_reales !== null 
            ? p.dias_reales 
            : (p.tarea?.duracion_sugerida ?? null);
          
          editingMap.set(p.tarea_id, {
            dias_reales: diasIniciales,
            monto: p.monto,
            observacion: p.observacion ?? '',
            incluye_materiales: p.incluye_materiales === true,
          });
        });
        setEditing(editingMap);

        // Obtener pdf_path desde eventos si existe
        if (obraId && data.presupuestos && data.presupuestos.length > 0) {
          const tareaIds = data.presupuestos.map((p: PresupuestoItem) => p.tarea_id).filter(Boolean);
          if (tareaIds.length > 0) {
            try {
              const pdfResponse = await fetch(`/api/presupuestos/pdf?obra_id=${obraId}&tarea_ids=${tareaIds.join(',')}`);
              if (pdfResponse.ok) {
                const pdfData = await pdfResponse.json();
                if (pdfData.success && pdfData.pdf_path) {
                  setPdfPath(pdfData.pdf_path);
                }
              }
            } catch (error) {
              console.error('[usePresupuestos] Error obteniendo PDF path:', error);
            }
          }
        }
      } catch (error) {
        console.error('[usePresupuestos] Error:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'No se pudieron cargar los presupuestos.',
          variant: 'destructive',
        });
        setObra(null);
        setPresupuestos([]);
        setCanvasNodes([]);
        setCanvasBudgetGroups([]);
      } finally {
        setLoading(false);
        console.log('[usePresupuestos] Loading finalizado');
      }
    }

    fetchPresupuestos();
  }, [obraId, toast, presupuestosUsanMock]);

  const onFieldChange = useCallback(
    (
      tareaId: string,
      field: 'dias_reales' | 'monto' | 'observacion' | 'incluye_materiales',
      value: number | null | string | boolean,
    ) => {
      setEditing((prev) => {
        const next = new Map(prev);
        const current = next.get(tareaId) || {
          dias_reales: null,
          monto: null,
          observacion: '',
          incluye_materiales: false,
        };
        if (field === 'observacion') {
          next.set(tareaId, { ...current, observacion: typeof value === 'string' ? value : '' });
        } else if (field === 'incluye_materiales') {
          next.set(tareaId, { ...current, incluye_materiales: value === true });
        } else {
          next.set(tareaId, { ...current, [field]: value as number | null });
        }
        return next;
      });
    },
    [],
  );

  const handleSaveDraft = useCallback(async (presupuestosFiltrados: PresupuestoItem[]) => {
    if (!obraId) return;

    if (presupuestosUsanMock) {
      toast({
        title: 'Borrador guardado (demo)',
        description: 'Los cambios se guardaron localmente. Sin conexión a base de datos.',
      });
      return;
    }

    setSaving(true);
    try {
      const presupuestosToSave = presupuestosFiltrados.map((presupuesto) => {
        const editData = editing.get(presupuesto.tarea_id) || {
          dias_reales: null,
          monto: null,
          observacion: '',
          incluye_materiales: false,
        };
        const estadoGuardado =
          presupuesto.estado === 'ENVIADO'
            ? 'ENVIADO'
            : presupuesto.estado === 'APROBADO'
              ? 'APROBADO'
              : 'PENDIENTE';
        return {
          tarea_id: presupuesto.tarea_id,
          dias_reales: editData.dias_reales,
          monto: editData.monto,
          observacion: editData.observacion,
          incluye_materiales: editData.incluye_materiales,
          estado: estadoGuardado as 'PENDIENTE' | 'ENVIADO' | 'APROBADO',
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
        setCanvasNodes((dataReload.canvas_nodes || []) as DbCanvasNodeRow[]);
        setCanvasBudgetGroups((dataReload.canvas_budget_groups || []) as CanvasBudgetGroupRow[]);
        const editingMap = new Map<string, PresupuestoEditState>();
        (dataReload.presupuestos || []).forEach((p: PresupuestoItem) => {
          // Precargar dias_reales con duracion_sugerida si dias_reales es null
          const diasIniciales = p.dias_reales !== null 
            ? p.dias_reales 
            : (p.tarea?.duracion_sugerida ?? null);
          
          editingMap.set(p.tarea_id, {
            dias_reales: diasIniciales,
            monto: p.monto,
            observacion: p.observacion ?? '',
            incluye_materiales: p.incluye_materiales === true,
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

  const handleSendPresupuesto = useCallback(async (
    presupuestosFiltrados: PresupuestoItem[],
    presupuestosAgrupadosPorEtapa: any,
    nombreContratista: string,
    etapaActiva?: 'ESTRUCTURA' | 'OBRA_GRIS' | 'TERMINACIONES'
  ) => {
    if (!obraId || !obra) return;

    if (presupuestosUsanMock) {
      setSaving(true);
      try {
        let etapaFinal: 'ESTRUCTURA' | 'OBRA_GRIS' | 'TERMINACIONES' = etapaActiva || 'OBRA_GRIS';
        const primeraEtapa = (presupuestosFiltrados[0]?.tarea?.etapa || '').toUpperCase();
        if (primeraEtapa.includes('ESTRUCTURA')) etapaFinal = 'ESTRUCTURA';
        else if (primeraEtapa.includes('GRIS') || primeraEtapa.includes('OBRA_GRIS')) etapaFinal = 'OBRA_GRIS';
        else if (primeraEtapa.includes('TERMINACION')) etapaFinal = 'TERMINACIONES';

        const presupuestosAgrupadosFiltrados = {
          ESTRUCTURA: etapaFinal === 'ESTRUCTURA' ? presupuestosFiltrados : [],
          OBRA_GRIS: etapaFinal === 'OBRA_GRIS' ? presupuestosFiltrados : [],
          TERMINACIONES: etapaFinal === 'TERMINACIONES' ? presupuestosFiltrados : [],
        };
        const editingFiltrado = new Map<string, PresupuestoEditState>();
        presupuestosFiltrados.forEach((p) => {
          const editData = editing.get(p.tarea_id);
          if (editData) editingFiltrado.set(p.tarea_id, editData);
        });

        const pdfBytes = generarPresupuestoPDFBytes({
          obra: {
            id: obra.id,
            name: obra.name || 'Sin nombre',
            direccion_completa: obra.direccion_completa,
            cantidad_plantas: obra.cantidad_plantas,
            fecha_inicio: obra.fecha_inicio,
            cliente: obra.cliente || null,
          },
          presupuestosAgrupadosPorEtapa: presupuestosAgrupadosFiltrados,
          nombreContratista,
          fechaGeneracion: new Date(),
          editing: editingFiltrado,
          etapaActiva: etapaFinal,
        });

        if (pdfBytes) {
          generarPresupuestoPDF({
            obra: {
              id: obra.id,
              name: obra.name || 'Sin nombre',
              direccion_completa: obra.direccion_completa,
              cantidad_plantas: obra.cantidad_plantas,
              fecha_inicio: obra.fecha_inicio,
              cliente: obra.cliente || null,
            },
            presupuestosAgrupadosPorEtapa: presupuestosAgrupadosFiltrados,
            nombreContratista,
            fechaGeneracion: new Date(),
            editing: editingFiltrado,
          });
        }

        setPresupuestos((prev) =>
          prev.map((p) => ({
            ...p,
            estado: presupuestosFiltrados.some((f) => f.tarea_id === p.tarea_id) ? 'ENVIADO' : p.estado,
          }))
        );
        toast({
          title: 'Presupuesto enviado (demo)',
          description: 'El PDF se descargó. Sin conexión a base de datos.',
        });
      } catch (err) {
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'No se pudo generar el PDF.',
          variant: 'destructive',
        });
      } finally {
        setSaving(false);
      }
      return;
    }

    setSaving(true);
    try {
      const incompletas = presupuestosFiltrados.filter((p) => {
        const ed = editing.get(p.tarea_id) || {
          dias_reales: null,
          monto: null,
          observacion: '',
          incluye_materiales: false,
        };
        if (p.estado === 'APROBADO' || p.estado === 'ENVIADO') return false;
        return !presupuestoLineaTieneValoresObligatorios(ed);
      });
      if (incompletas.length > 0) {
        toast({
          title: 'Faltan datos',
          description: `Completá días y precio (mayores a cero) en las ${incompletas.length} partida(s) pendientes antes de publicar.`,
          variant: 'destructive',
        });
        setSaving(false);
        return;
      }

      // 1. Generar PDF automáticamente para la etapa activa
      // Si no se proporciona etapaActiva, determinar desde los presupuestos filtrados
      let etapaFinal: 'ESTRUCTURA' | 'OBRA_GRIS' | 'TERMINACIONES' = etapaActiva || 'ESTRUCTURA';
      
      if (!etapaActiva && presupuestosFiltrados.length > 0) {
        // Determinar la etapa activa basándose en los presupuestos filtrados
        const primeraEtapa = (presupuestosFiltrados[0]?.tarea?.etapa || '').toUpperCase();
        
        if (primeraEtapa.includes('ESTRUCTURA')) etapaFinal = 'ESTRUCTURA';
        else if (primeraEtapa.includes('GRIS') || primeraEtapa.includes('OBRA_GRIS')) etapaFinal = 'OBRA_GRIS';
        else if (primeraEtapa.includes('TERMINACION')) etapaFinal = 'TERMINACIONES';
      }

      console.log('[handleSendPresupuesto] Etapa activa determinada:', etapaFinal);
      console.log('[handleSendPresupuesto] Presupuestos filtrados:', presupuestosFiltrados.length);
      console.log('[handleSendPresupuesto] Presupuestos filtrados IDs:', presupuestosFiltrados.map(p => ({ id: p.tarea_id, etapa: p.tarea?.etapa })));
      
      // Crear un objeto de presupuestos agrupados SOLO con los presupuestos filtrados (de la etapa activa)
      const presupuestosAgrupadosPorEtapaFiltrados = {
        ESTRUCTURA: etapaFinal === 'ESTRUCTURA' ? presupuestosFiltrados : [],
        OBRA_GRIS: etapaFinal === 'OBRA_GRIS' ? presupuestosFiltrados : [],
        TERMINACIONES: etapaFinal === 'TERMINACIONES' ? presupuestosFiltrados : [],
      };
      
      console.log('[handleSendPresupuesto] Presupuestos agrupados filtrados:', {
        ESTRUCTURA: presupuestosAgrupadosPorEtapaFiltrados.ESTRUCTURA.length,
        OBRA_GRIS: presupuestosAgrupadosPorEtapaFiltrados.OBRA_GRIS.length,
        TERMINACIONES: presupuestosAgrupadosPorEtapaFiltrados.TERMINACIONES.length,
      });
      
      // Filtrar el editing map para solo incluir los presupuestos filtrados
      const editingFiltrado = new Map<string, PresupuestoEditState>();
      presupuestosFiltrados.forEach((p) => {
        const editData = editing.get(p.tarea_id);
        if (editData) {
          editingFiltrado.set(p.tarea_id, editData);
        }
      });
      
      console.log('[handleSendPresupuesto] Editing filtrado:', {
        total: editing.size,
        filtrado: editingFiltrado.size,
        tareaIds: Array.from(editingFiltrado.keys()),
      });
      
      const fechaGeneracion = new Date();
      
      let pdfBytes: Uint8Array | null = null;
      try {
        pdfBytes = generarPresupuestoPDFBytes({
          obra: {
            id: obra.id,
            name: obra.name || 'Sin nombre',
            direccion_completa: obra.direccion_completa,
            cantidad_plantas: obra.cantidad_plantas,
            fecha_inicio: obra.fecha_inicio,
            cliente: obra.cliente || null,
          },
          presupuestosAgrupadosPorEtapa: presupuestosAgrupadosPorEtapaFiltrados, // Usar solo los filtrados
          nombreContratista,
          fechaGeneracion,
          editing: editingFiltrado, // Usar solo el editing filtrado
          etapaActiva: etapaFinal, // Usar la etapa determinada
        });

        if (!pdfBytes) {
          console.error('[handleSendPresupuesto] No se generaron bytes del PDF');
          throw new Error('No se pudieron generar los bytes del PDF. Verifica que haya presupuestos para la etapa seleccionada.');
        }
        
        console.log('[handleSendPresupuesto] PDF generado exitosamente, tamaño:', pdfBytes.length, 'bytes');
      } catch (error) {
        console.error('[handleSendPresupuesto] Error generando PDF:', error);
        throw error;
      }

      // 2. Subir PDF al bucket de Supabase
      const tareaIds = presupuestosFiltrados.map((p) => p.tarea_id).filter(Boolean);
      const toBase64 = (bytes: Uint8Array) => {
        let binary = '';
        bytes.forEach((b) => (binary += String.fromCharCode(b)));
        return btoa(binary);
      };

      const uploadResponse = await fetch('/api/presupuestos/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          obra_id: obraId,
          tarea_ids: tareaIds,
          etapa: etapaFinal, // Usar la etapa determinada
          pdfBase64: toBase64(pdfBytes),
        }),
      });

      if (!uploadResponse.ok) {
        const errData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al subir el PDF');
      }

      const uploadData = await uploadResponse.json();
      if (uploadData.success && uploadData.path) {
        setPdfPath(uploadData.path);
      }

      // 3. Enviar presupuestos con estado ENVIADO
      const presupuestosToSend = presupuestosFiltrados.map((presupuesto) => {
        const editData = editing.get(presupuesto.tarea_id) || {
          dias_reales: null,
          monto: null,
          observacion: '',
          incluye_materiales: false,
        };
        return {
          tarea_id: presupuesto.tarea_id,
          dias_reales: editData.dias_reales,
          monto: editData.monto,
          observacion: editData.observacion,
          incluye_materiales: editData.incluye_materiales,
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
        description: 'El presupuesto se envió correctamente al cliente. El PDF fue generado y guardado automáticamente.',
      });

      // 4. Recargar datos
      const responseReload = await fetch(`/api/socio/presupuestos?obra_id=${obraId}`);
      if (responseReload.ok) {
        const dataReload = await responseReload.json();
        setPresupuestos(dataReload.presupuestos || []);
        setCanvasNodes((dataReload.canvas_nodes || []) as DbCanvasNodeRow[]);
        setCanvasBudgetGroups((dataReload.canvas_budget_groups || []) as CanvasBudgetGroupRow[]);
        const editingMap = new Map<string, PresupuestoEditState>();
        (dataReload.presupuestos || []).forEach((p: PresupuestoItem) => {
          // Precargar dias_reales con duracion_sugerida si dias_reales es null
          const diasIniciales = p.dias_reales !== null 
            ? p.dias_reales 
            : (p.tarea?.duracion_sugerida ?? null);
          
          editingMap.set(p.tarea_id, {
            dias_reales: diasIniciales,
            monto: p.monto,
            observacion: p.observacion ?? '',
            incluye_materiales: p.incluye_materiales === true,
          });
        });
        setEditing(editingMap);

        // Actualizar pdfPath después de enviar
        if (uploadData?.success && uploadData?.path) {
          setPdfPath(uploadData.path);
        } else {
          // Si no se obtuvo del upload, intentar obtenerlo desde eventos
          const tareaIdsReload = (dataReload.presupuestos || []).map((p: PresupuestoItem) => p.tarea_id).filter(Boolean);
          if (tareaIdsReload.length > 0) {
            try {
              const pdfResponse = await fetch(`/api/presupuestos/pdf?obra_id=${obraId}&tarea_ids=${tareaIdsReload.join(',')}`);
              if (pdfResponse.ok) {
                const pdfData = await pdfResponse.json();
                if (pdfData.success && pdfData.pdf_path) {
                  setPdfPath(pdfData.pdf_path);
                }
              }
            } catch (error) {
              console.error('[usePresupuestos] Error obteniendo PDF path después de enviar:', error);
            }
          }
        }
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
  }, [obraId, obra, editing, toast, presupuestosUsanMock]);

  const clearPdfPath = useCallback(() => {
    setPdfPath(null);
  }, []);

  return {
    obra,
    presupuestos,
    canvasNodes,
    canvasBudgetGroups,
    editing,
    loading,
    saving,
    pdfPath,
    onFieldChange,
    handleSaveDraft,
    handleSendPresupuesto,
    clearPdfPath,
  };
}

