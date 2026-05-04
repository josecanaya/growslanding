'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { Loader2, Save, Send, FileText, Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/grows/Button';
import { useToast } from '@/components/ui/use-toast';
import { generarPresupuestoPDF, generarPresupuestoPDFBytes } from '@/lib/pdf/generarPresupuestoPDF';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { EtapasButtons } from '@/components/socio/presupuestos/EtapasButtons';
import { ResumenObra } from '@/components/socio/presupuestos/ResumenObra';
import { ListaTareas } from '@/components/socio/presupuestos/ListaTareas';
import { ListaObras } from '@/components/socio/presupuestos/ListaObras';
import { ListaObrasStitch } from '@/components/socio/presupuestos/ListaObrasStitch';
import { PresupuestoStitchBento } from '@/components/socio/presupuestos/PresupuestoStitchBento';
import { ResumenAcumulado } from '@/components/socio/presupuestos/ResumenAcumulado';
import { usePresupuestos } from '@/components/socio/presupuestos/hooks/usePresupuestos';
import { USE_MOCK_DATA, FORCE_PRESUPUESTOS_MOCK, MOCK_OBRAS_PARA_PRESUPUESTOS } from '@/lib/mocks/socioMockData';
import { cn } from '@/lib/utils';

interface ObraConPresupuestos {
  obra_id: string;
  obra_name: string;
  direccion_completa?: string | null;
  fecha_inicio?: string | null;
  pendientes: number;
  enviados: number;
  aprobados: number;
  stitch_estado?: 'aprobado' | 'visto' | 'enviado' | 'rechazado' | 'pendiente';
}

type PresupuestoEtapaTab = 'ESTRUCTURA' | 'OBRA_GRIS' | 'TERMINACIONES';

/**
 * Las tareas creadas desde el canvas (`publicar-tareas`) suelen tener `tareas.etapa` en NULL.
 * El filtro anterior exigía texto tipo "ESTRUCTURA" y ocultaba todas → pantalla vacía y sin acciones.
 */
function bucketEtapaPresupuesto(etapaRaw: string | null | undefined): PresupuestoEtapaTab {
  const etapa = (etapaRaw ?? '').toUpperCase().trim();
  if (etapa.includes('GRIS') || etapa.includes('OBRA_GRIS')) {
    return 'OBRA_GRIS';
  }
  if (etapa.includes('TERMINACION')) {
    return 'TERMINACIONES';
  }
  if (etapa.includes('ESTRUCTURA')) {
    return 'ESTRUCTURA';
  }
  return 'ESTRUCTURA';
}

function PresupuestosContent() {
  const searchParams = useSearchParams();
  const obraId = searchParams.get('obra_id');
  const { toast } = useToast();
  const currentUser = useCurrentUser();
  const presupuestosUsanMock = USE_MOCK_DATA || FORCE_PRESUPUESTOS_MOCK;

  const [obras, setObras] = useState<ObraConPresupuestos[]>([]);
  const [loadingObras, setLoadingObras] = useState(false);
  const [nombreContratista, setNombreContratista] = useState<string>('Contratista');

  const [activeEtapa, setActiveEtapa] = useState<'ESTRUCTURA' | 'OBRA_GRIS' | 'TERMINACIONES'>('ESTRUCTURA');
  const [stagePdfPath, setStagePdfPath] = useState<string | null>(null);

  const {
    obra,
    presupuestos,
    editing,
    loading,
    saving,
    pdfPath,
    onFieldChange,
    handleSaveDraft,
    handleSendPresupuesto,
    clearPdfPath,
  } = usePresupuestos(obraId);

  // Cargar lista de obras si no hay obra_id (mock o API)
  useEffect(() => {
    if (obraId) return;

    if (presupuestosUsanMock) {
      setObras(
        MOCK_OBRAS_PARA_PRESUPUESTOS.map((o) => ({
          obra_id: o.obra_id,
          obra_name: o.obra_name,
          direccion_completa: o.direccion_completa ?? null,
          fecha_inicio: o.fecha_inicio ?? null,
          pendientes: o.pendientes,
          enviados: o.enviados,
          aprobados: o.aprobados,
          stitch_estado: o.stitch_estado,
        }))
      );
      setLoadingObras(false);
      return;
    }

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
  }, [obraId, presupuestosUsanMock]);

  // Filtrar presupuestos por etapa activa
  const presupuestosFiltrados = useMemo(() => {
    if (!presupuestos) return [];

    return presupuestos.filter((p) => bucketEtapaPresupuesto(p.tarea?.etapa) === activeEtapa);
  }, [presupuestos, activeEtapa]);

  // Resolver PDF correspondiente a la etapa activa (omitir en demo)
  useEffect(() => {
    if (presupuestosUsanMock || !obraId || presupuestosFiltrados.length === 0) {
      setStagePdfPath(null);
      return;
    }

    const tareaIds = presupuestosFiltrados.map((p) => p.tarea_id).filter(Boolean);
    if (tareaIds.length === 0) {
      setStagePdfPath(null);
      return;
    }

    const params = new URLSearchParams({
      obra_id: obraId,
      tarea_ids: tareaIds.join(','),
    });

    (async () => {
      try {
        const res = await fetch(`/api/presupuestos/pdf?${params.toString()}`);
        if (!res.ok) {
          setStagePdfPath(null);
          return;
        }

        const data = await res.json();
        if (data?.success && data?.pdf_path) {
          setStagePdfPath(data.pdf_path);
        } else {
          setStagePdfPath(null);
        }
      } catch (error) {
        console.error('[PresupuestosPage] Error obteniendo PDF de etapa:', error);
        setStagePdfPath(null);
      }
    })();
  }, [obraId, activeEtapa, presupuestosFiltrados, presupuestosUsanMock]);

  // Contar tareas por etapa
  const etapaCounts = useMemo(() => {
    if (!presupuestos) {
      return { estructura: 0, obraGris: 0, terminaciones: 0 };
    }

    let estructura = 0;
    let obraGris = 0;
    let terminaciones = 0;

    presupuestos.forEach((p) => {
      const b = bucketEtapaPresupuesto(p.tarea?.etapa);
      if (b === 'ESTRUCTURA') {
        estructura++;
      } else if (b === 'OBRA_GRIS') {
        obraGris++;
      } else {
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

  // Verificar si los presupuestos ya fueron enviados o aprobados
  // Solo considerar enviados si TODOS están enviados o aprobados
  const todosEnviadosOAprobados = presupuestosFiltrados.length > 0 && presupuestosFiltrados.every(
    (p) => p.estado === 'ENVIADO' || p.estado === 'APROBADO'
  );
  const presupuestosAprobados = presupuestosFiltrados.every(
    (p) => p.estado === 'APROBADO'
  );
  const puedeEditar = !presupuestosAprobados; // Solo puede editar si NO todos están aprobados
  const hayPendientes = presupuestosFiltrados.some(
    (p) => p.estado === 'PENDIENTE' || !p.estado || p.estado === ''
  );

  // Función para eliminar PDF y permitir editar
  const handleEliminarPDFYEditar = async () => {
    const currentPdfPath = stagePdfPath || pdfPath;
    if (!currentPdfPath || !obraId || !presupuestosFiltrados.length) return;

    try {
      const tareaIds = presupuestosFiltrados.map((p) => p.tarea_id).filter(Boolean);
      
      const response = await fetch('/api/presupuestos/eliminar-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          obra_id: obraId,
          tarea_ids: tareaIds,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Error al eliminar el PDF');
      }

      // Limpiar el pdfPath local
      clearPdfPath();
      setStagePdfPath(null);

      // Recargar presupuestos para actualizar el estado
      // El hook se actualizará automáticamente cuando cambie obraId
      // Por ahora, forzamos un pequeño delay y luego recargamos
      setTimeout(() => {
        window.location.reload();
      }, 500);

      toast({
        title: 'PDF eliminado',
        description: 'Podés generar un nuevo PDF con los valores corregidos.',
      });
    } catch (error) {
      console.error('[PresupuestosPage] Error eliminando PDF:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo eliminar el PDF.',
        variant: 'destructive',
      });
    }
  };

  // Función para ver PDF enviado
  const handleVerPDFEnviado = async () => {
    const currentPdfPath = stagePdfPath || pdfPath;
    if (!currentPdfPath || !obraId) return;

    try {
      const supabase = createClientComponentClient();
      const pathSinPrefijo = currentPdfPath.startsWith('actas/') ? currentPdfPath.replace('actas/', '') : currentPdfPath;
      
      // Intentar obtener URL pública primero
      const { data: urlData } = supabase.storage.from('actas').getPublicUrl(pathSinPrefijo);
      
      let pdfUrl: string | null = null;
      if (urlData?.publicUrl) {
        pdfUrl = urlData.publicUrl;
      } else {
        // Si no hay URL pública, generar URL firmada (bucket privado)
        const { data: signedUrlData, error: signedError } = await supabase.storage
          .from('actas')
          .createSignedUrl(pathSinPrefijo, 3600); // URL válida por 1 hora
        
        if (signedError || !signedUrlData?.signedUrl) {
          throw new Error('No se pudo obtener la URL del PDF.');
        }
        pdfUrl = signedUrlData.signedUrl;
      }

      if (pdfUrl) {
        // Abrir PDF en nueva pestaña
        window.open(pdfUrl, '_blank');
      }
    } catch (error) {
      console.error('[PresupuestosPage] Error abriendo PDF:', error);
      toast({
        title: 'Error',
        description: 'No se pudo abrir el PDF. Intentá nuevamente.',
        variant: 'destructive',
      });
    }
  };

  // Agrupar presupuestos por etapa para el PDF (usar todos los presupuestos, no solo los filtrados)
  const presupuestosAgrupadosPorEtapa = useMemo(() => {
    const agrupados = {
      ESTRUCTURA: [] as typeof presupuestos,
      OBRA_GRIS: [] as typeof presupuestos,
      TERMINACIONES: [] as typeof presupuestos,
    };

    presupuestos.forEach((p) => {
      const bucket = bucketEtapaPresupuesto(p.tarea?.etapa);
      agrupados[bucket].push(p);
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

  const toBase64 = (bytes: Uint8Array) => {
    let binary = '';
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
  };

  // Función para generar PDF
  const handleGenerarPDF = async () => {
    if (!obra) return;
    if (presupuestosFiltrados.length === 0) {
      toast({
        title: 'Sin tareas',
        description: 'No hay tareas en la etapa seleccionada para generar el PDF.',
        variant: 'destructive',
      });
      return;
    }

    if (presupuestosUsanMock) {
      try {
        const fechaGeneracion = new Date();
        const pdfBytes = generarPresupuestoPDFBytes({
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
          fechaGeneracion,
          editing,
          etapaActiva: activeEtapa,
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
            presupuestosAgrupadosPorEtapa,
            nombreContratista: nombreContratista,
            fechaGeneracion,
            editing,
          });
        }
        toast({
          title: 'PDF generado (demo)',
          description: 'Se descargó en tu dispositivo. No se sube al servidor en modo demo.',
        });
      } catch (error) {
        console.error('[PresupuestosPage] Error generando PDF (demo):', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'No se pudo generar el PDF.',
          variant: 'destructive',
        });
      }
      return;
    }

    try {
      const fechaGeneracion = new Date();

      // Generar bytes para la etapa activa
      const pdfBytes = generarPresupuestoPDFBytes({
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
        fechaGeneracion,
        editing,
        etapaActiva: activeEtapa, // Usar la etapa activa seleccionada
      });

      if (!pdfBytes) {
        throw new Error('No se pudieron generar los bytes del PDF');
      }

      // Subir al backend para guardar en Storage + eventos
      const tareaIds = presupuestosFiltrados.map((p) => p.tarea_id).filter(Boolean);
      const payload = {
        obra_id: obra.id,
        tarea_ids: tareaIds,
        etapa: activeEtapa,
        pdfBase64: toBase64(pdfBytes),
      };

      const uploadResponse = await fetch('/api/presupuestos/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!uploadResponse.ok) {
        const errData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al subir el PDF');
      }

      const uploadData = await uploadResponse.json().catch(() => null);
      if (uploadData?.success && uploadData?.path) {
        setStagePdfPath(uploadData.path);
      }

      // Descargar localmente (mantener experiencia actual)
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
        fechaGeneracion,
        editing,
      });

      toast({
        title: 'PDF generado',
        description: 'PDF generado y guardado correctamente. El cliente ya puede verlo.',
      });
    } catch (error) {
      console.error('[PresupuestosPage] Error generando PDF:', error);

      // Descargar localmente como fallback si no se descargó
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
      } catch (e) {
        console.error('[PresupuestosPage] Error en fallback de descarga:', e);
      }

      toast({
        title: 'Error',
        description: 'No se pudo subir el PDF, pero se descargó localmente.',
        variant: 'destructive',
      });
    }
  };

  // Vista de lista de obras (cuando no hay obra_id)
  if (!obraId) {
    if (presupuestosUsanMock) {
      return (
        <div className="min-h-screen bg-stitch-surface px-4 pb-28 pt-2 font-stitch-body text-stitch-on-surface">
          <header className="sticky top-0 z-10 -mx-4 border-b border-stitch-surface-container bg-slate-50/95 px-4 py-4 backdrop-blur">
            <h1 className="font-stitch-headline text-base font-extrabold tracking-widest text-stitch-primary">
              CONSTRUCCIÓN
            </h1>
          </header>
          <div className="pt-6">
            <ListaObrasStitch obras={obras} loading={loadingObras} />
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="border-b border-slate-200 bg-white px-4 py-3">
          <h1 className="text-lg font-semibold text-slate-900">Presupuestos</h1>
          <p className="mt-1 text-xs text-slate-500">Seleccioná una obra para ver y editar los presupuestos</p>
        </div>
        <div className="p-4">
          <ListaObras obras={obras} loading={loadingObras} />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={cn(
          'flex min-h-screen items-center justify-center',
          presupuestosUsanMock && 'bg-stitch-surface font-stitch-body',
        )}
      >
        <div
          className={cn(
            'flex items-center gap-2',
            presupuestosUsanMock ? 'text-stitch-primary' : 'text-slate-500',
          )}
        >
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Cargando presupuestos...</span>
        </div>
      </div>
    );
  }

  if (!obra) {
    return (
      <div
        className={cn(
          'flex min-h-screen items-center justify-center p-4',
          presupuestosUsanMock && 'bg-stitch-surface font-stitch-body',
        )}
      >
        <div className="text-center">
          <h2
            className={cn(
              'text-base font-semibold',
              presupuestosUsanMock ? 'font-stitch-headline text-stitch-primary' : 'text-slate-900',
            )}
          >
            Obra no encontrada
          </h2>
          <p
            className={cn('mt-2 text-sm', presupuestosUsanMock ? 'text-stitch-on-surface/70' : 'text-slate-500')}
          >
            La obra especificada no existe o no tenés acceso a ella.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'min-h-screen pb-32',
        presupuestosUsanMock
          ? 'bg-stitch-surface font-stitch-body text-stitch-on-surface'
          : 'bg-slate-50',
      )}
    >
      {presupuestosUsanMock && (
        <div className="px-4 pt-2">
          <PresupuestoStitchBento
            titulo={obra.name || 'Obra'}
            totalMonto={totalesGlobales.totalMonto}
            totalDias={totalesGlobales.totalDias}
          />
        </div>
      )}

      {/* Encabezado compacto */}
      <ResumenObra obra={obra} stitchMode={presupuestosUsanMock} />

      {/* Botones de etapa */}
      <EtapasButtons
        activeEtapa={activeEtapa}
        onEtapaChange={setActiveEtapa}
        counts={etapaCounts}
        stitchMode={presupuestosUsanMock}
      />

      {/* Lista de tareas */}
      {hasPresupuestos ? (
        <ListaTareas
          presupuestos={presupuestosFiltrados}
          onFieldChange={onFieldChange}
          editing={editing}
          stitchMode={presupuestosUsanMock}
        />
      ) : (
        <div className="px-4 py-12 text-center">
          <p
            className={cn(
              'text-sm',
              presupuestosUsanMock ? 'text-stitch-on-surface/70' : 'text-slate-500',
            )}
          >
            No hay tareas para la etapa {activeEtapa.toLowerCase()}.
          </p>
        </div>
      )}

      {/* Resumen acumulado y botonera flotante (por encima del TabBar del layout: bottom-[90px]) */}
      {showActions && (
        <div
          className={cn(
            'fixed bottom-[90px] left-0 right-0 z-20 mx-auto w-full max-w-[480px] border-t backdrop-blur-sm',
            presupuestosUsanMock
              ? 'border-stitch-primary/10 bg-stitch-surface-container-lowest/95 shadow-stitch-nav'
              : 'border-slate-200 bg-white/95 shadow-[0_-4px_14px_rgba(0,0,0,0.08)]',
          )}
        >
          {/* Resumen (días, total, cantidad) */}
          <ResumenAcumulado
            totalDias={totales.totalDias}
            totalMonto={totales.totalMonto}
            cantidadTareas={presupuestosFiltrados.length}
            stitchMode={presupuestosUsanMock}
          />
          {/* Botones: Enviar presupuesto y Generar PDF siempre visibles */}
          <div className="px-4 py-3 flex flex-col sm:flex-row gap-2 sm:flex-wrap sm:gap-3">
            {hayPendientes || !todosEnviadosOAprobados ? (
              // Si hay pendientes o no todos están enviados/aprobados: mostrar botones de guardar, enviar y generar PDF
              <>
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
                  onClick={() => handleSendPresupuesto(
                    presupuestosFiltrados,
                    presupuestosAgrupadosPorEtapa,
                    nombreContratista,
                    activeEtapa // Pasar la etapa activa directamente
                  )}
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
              </>
            ) : (
              // Si ya se envió: mostrar botones de ver PDF y editar (si no está aprobado)
              <>
                {(stagePdfPath || pdfPath) && (
                  <Button
                    variant="primary"
                    onClick={handleVerPDFEnviado}
                    disabled={saving}
                    className="flex-1"
                    size="sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver PDF enviado
                  </Button>
                )}
                {puedeEditar && (
                  <Button
                    variant="secondary"
                    onClick={handleEliminarPDFYEditar}
                    disabled={saving}
                    className="flex-1"
                    size="sm"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}
              </>
            )}
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
