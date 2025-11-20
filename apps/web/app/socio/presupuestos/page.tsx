'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { Loader2, Save, Send, FileText } from 'lucide-react';
import { Button } from '@/components/ui/grows/Button';
import { useToast } from '@/components/ui/use-toast';
import { generarPresupuestoPDF } from '@/lib/pdf/generarPresupuestoPDF';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { EtapasButtons } from '@/components/socio/presupuestos/EtapasButtons';
import { ResumenObra } from '@/components/socio/presupuestos/ResumenObra';
import { ListaTareas } from '@/components/socio/presupuestos/ListaTareas';
import { ListaObras } from '@/components/socio/presupuestos/ListaObras';
import { ResumenAcumulado } from '@/components/socio/presupuestos/ResumenAcumulado';
import { usePresupuestos } from '@/components/socio/presupuestos/hooks/usePresupuestos';

interface ObraConPresupuestos {
  obra_id: string;
  obra_name: string;
  direccion_completa?: string | null;
  fecha_inicio?: string | null;
  pendientes: number;
  enviados: number;
  aprobados: number;
}

function PresupuestosContent() {
  const searchParams = useSearchParams();
  const obraId = searchParams.get('obra_id');
  const { toast } = useToast();
  const currentUser = useCurrentUser();
  
  const [obras, setObras] = useState<ObraConPresupuestos[]>([]);
  const [loadingObras, setLoadingObras] = useState(false);
  const [nombreContratista, setNombreContratista] = useState<string>('Contratista');

  const [activeEtapa, setActiveEtapa] = useState<'ESTRUCTURA' | 'OBRA_GRIS' | 'TERMINACIONES'>('ESTRUCTURA');

  const {
    obra,
    presupuestos,
    editing,
    loading,
    saving,
    onFieldChange,
    handleSaveDraft,
    handleSendPresupuesto,
  } = usePresupuestos(obraId);

  // Cargar lista de obras si no hay obra_id
  useEffect(() => {
    if (obraId) return;

    async function fetchObras() {
      setLoadingObras(true);
      try {
        const response = await fetch('/api/socio/presupuestos');
        if (!response.ok) {
          throw new Error('Error al cargar obras');
        }
        const data = await response.json();
        setObras(data.obras || []);
      } catch (error) {
        console.error('[PresupuestosPage] Error cargando obras:', error);
        setObras([]);
      } finally {
        setLoadingObras(false);
      }
    }

    fetchObras();
  }, [obraId]);

  // Filtrar presupuestos por etapa activa
  const presupuestosFiltrados = useMemo(() => {
    if (!presupuestos) return [];
    
    return presupuestos.filter((p) => {
      const etapa = p.tarea?.etapa?.toUpperCase() || '';
      if (activeEtapa === 'ESTRUCTURA') {
        return etapa.includes('ESTRUCTURA');
      } else if (activeEtapa === 'OBRA_GRIS') {
        return etapa.includes('GRIS') || etapa.includes('OBRA_GRIS');
      } else if (activeEtapa === 'TERMINACIONES') {
        return etapa.includes('TERMINACION');
      }
      return false;
    });
  }, [presupuestos, activeEtapa]);

  // Contar tareas por etapa
  const etapaCounts = useMemo(() => {
    if (!presupuestos) {
      return { estructura: 0, obraGris: 0, terminaciones: 0 };
    }

    let estructura = 0;
    let obraGris = 0;
    let terminaciones = 0;

    presupuestos.forEach((p) => {
      const etapa = p.tarea?.etapa?.toUpperCase() || '';
      if (etapa.includes('ESTRUCTURA')) {
        estructura++;
      } else if (etapa.includes('GRIS') || etapa.includes('OBRA_GRIS')) {
        obraGris++;
      } else if (etapa.includes('TERMINACION')) {
        terminaciones++;
      }
    });

    return { estructura, obraGris, terminaciones };
  }, [presupuestos]);

  // Calcular totales acumulados (ANTES de los returns condicionales)
  const totales = useMemo(() => {
    if (!obraId || !presupuestosFiltrados || presupuestosFiltrados.length === 0) {
      return { totalDias: 0, totalMonto: 0 };
    }

    let totalDias = 0;
    let totalMonto = 0;
    
    presupuestosFiltrados.forEach((p) => {
      const editData = editing.get(p.tarea_id) || { dias_reales: null, monto: null };
      if (editData.dias_reales !== null && !isNaN(editData.dias_reales)) {
        totalDias += editData.dias_reales;
      }
      if (editData.monto !== null && !isNaN(editData.monto)) {
        totalMonto += editData.monto;
      }
    });

    return { totalDias: Math.round(totalDias * 10) / 10, totalMonto };
  }, [obraId, presupuestosFiltrados, editing]);

  const hasPresupuestos = presupuestosFiltrados.length > 0;
  const showActions = hasPresupuestos;

  // Agrupar presupuestos por etapa para el PDF (usar todos los presupuestos, no solo los filtrados)
  const presupuestosAgrupadosPorEtapa = useMemo(() => {
    const agrupados = {
      ESTRUCTURA: [] as typeof presupuestos,
      OBRA_GRIS: [] as typeof presupuestos,
      TERMINACIONES: [] as typeof presupuestos,
    };

    presupuestos.forEach((p) => {
      const etapa = p.tarea?.etapa?.toUpperCase() || '';
      if (etapa.includes('ESTRUCTURA')) {
        agrupados.ESTRUCTURA.push(p);
      } else if (etapa.includes('GRIS') || etapa.includes('OBRA_GRIS')) {
        agrupados.OBRA_GRIS.push(p);
      } else if (etapa.includes('TERMINACION')) {
        agrupados.TERMINACIONES.push(p);
      }
    });

    return agrupados;
  }, [presupuestos]);

  // Calcular totales globales para el PDF (todos los presupuestos)
  const totalesGlobales = useMemo(() => {
    if (!obraId || !presupuestos || presupuestos.length === 0) {
      return { totalDias: 0, totalMonto: 0 };
    }

    let totalDias = 0;
    let totalMonto = 0;
    
    presupuestos.forEach((p) => {
      const editData = editing.get(p.tarea_id) || { dias_reales: null, monto: null };
      if (editData.dias_reales !== null && !isNaN(editData.dias_reales)) {
        totalDias += editData.dias_reales;
      }
      if (editData.monto !== null && !isNaN(editData.monto)) {
        totalMonto += editData.monto;
      }
    });

    return { totalDias: Math.round(totalDias * 10) / 10, totalMonto };
  }, [obraId, presupuestos, editing]);

  // Obtener nombre del contratista
  useEffect(() => {
    async function fetchNombreContratista() {
      if (!currentUser?.email) {
        setNombreContratista('Contratista');
        return;
      }
      
      try {
        // Obtener el nombre del socio desde la base de datos
        const response = await fetch('/api/socio/presupuestos');
        if (response.ok) {
          // Intentar obtener desde currentUser primero
          const nombre = currentUser.name || currentUser.email?.split('@')[0] || 'Contratista';
          setNombreContratista(nombre);
        } else {
          setNombreContratista(currentUser.name || currentUser.email?.split('@')[0] || 'Contratista');
        }
      } catch (error) {
        console.error('[PresupuestosPage] Error obteniendo nombre:', error);
        setNombreContratista(currentUser.name || currentUser.email?.split('@')[0] || 'Contratista');
      }
    }
    
    if (currentUser) {
      fetchNombreContratista();
    }
  }, [currentUser]);

  // Función para generar PDF
  const handleGenerarPDF = () => {
    if (!obra) return;

    try {
      generarPresupuestoPDF({
        obra: {
          id: obra.id,
          name: obra.name || 'Sin nombre',
          direccion_completa: obra.direccion_completa,
          cantidad_plantas: obra.cantidad_plantas,
          fecha_inicio: obra.fecha_inicio,
          cliente: obra.cliente || null,
        },
        presupuestosAgrupadosPorEtapa,
        nombreContratista: nombreContratista,
        fechaGeneracion: new Date(),
        editing,
      });

      toast({
        title: 'PDFs generados',
        description: `Se generaron los presupuestos por etapa correctamente.`,
      });
    } catch (error) {
      console.error('[PresupuestosPage] Error generando PDF:', error);
      toast({
        title: 'Error',
        description: 'No se pudo generar el PDF. Intenta nuevamente.',
        variant: 'destructive',
      });
    }
  };

  // Vista de lista de obras (cuando no hay obra_id)
  if (!obraId) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-4 py-3">
          <h1 className="text-lg font-semibold text-slate-900">Presupuestos</h1>
          <p className="text-xs text-slate-500 mt-1">
            Seleccioná una obra para ver y editar los presupuestos
          </p>
        </div>
        <div className="p-4">
          <ListaObras obras={obras} loading={loadingObras} />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Cargando presupuestos...</span>
        </div>
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-base font-semibold text-slate-900">Obra no encontrada</h2>
          <p className="text-sm text-slate-500 mt-2">
            La obra especificada no existe o no tenés acceso a ella.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Encabezado compacto */}
      <ResumenObra obra={obra} />

      {/* Botones de etapa */}
      <EtapasButtons
        activeEtapa={activeEtapa}
        onEtapaChange={setActiveEtapa}
        counts={etapaCounts}
      />

      {/* Lista de tareas */}
      {hasPresupuestos ? (
        <ListaTareas
          presupuestos={presupuestosFiltrados}
          onFieldChange={onFieldChange}
          editing={editing}
        />
      ) : (
        <div className="px-4 py-12 text-center">
          <p className="text-sm text-slate-500">
            No hay tareas para la etapa {activeEtapa.toLowerCase()}.
          </p>
        </div>
      )}

      {/* Resumen acumulado y botonera flotante */}
      {showActions && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-10 shadow-lg">
          {/* Resumen acumulado */}
          <ResumenAcumulado
            totalDias={totales.totalDias}
            totalMonto={totales.totalMonto}
            cantidadTareas={presupuestosFiltrados.length}
          />
          
          {/* Botones */}
          <div className="px-4 py-3 flex gap-3">
            <Button
              variant="secondary"
              onClick={() => handleSaveDraft(presupuestosFiltrados)}
              disabled={saving}
              loading={saving}
              className="flex-1"
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar borrador
            </Button>
            <Button
              variant="primary"
              onClick={() => handleSendPresupuesto(presupuestosFiltrados)}
              disabled={saving}
              loading={saving}
              className="flex-1"
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar presupuesto
            </Button>
            <Button
              variant="secondary"
              onClick={handleGenerarPDF}
              disabled={saving}
              className="flex-shrink-0"
              size="sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              Generar PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PresupuestosPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Cargando...</span>
        </div>
      </div>
    }>
      <PresupuestosContent />
    </Suspense>
  );
}
