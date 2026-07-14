'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import {
  Loader2,
  Save,
  Send,
  FileText,
  Eye,
  Edit,
  MapPin,
  Printer,
  Download,
  Share2,
  MessageCircle,
  Scale,
  MoreVertical,
} from 'lucide-react';
import { SolicitarCambioPresupuestoModal } from '@/components/socio/presupuestos/SolicitarCambioPresupuestoModal';
import { Button } from '@/components/ui/grows/Button';
import { useToast } from '@/components/ui/use-toast';
import { generarPresupuestoPDF, generarPresupuestoPDFBytes } from '@/lib/pdf/generarPresupuestoPDF';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { EtapasButtons } from '@/components/socio/presupuestos/EtapasButtons';
import { ModalVerPlanos } from '@/components/socio/presupuestos/ModalVerPlanos';
import { ListaTareas } from '@/components/socio/presupuestos/ListaTareas';
import { ListaObras } from '@/components/socio/presupuestos/ListaObras';
import { ListaObrasStitch } from '@/components/socio/presupuestos/ListaObrasStitch';
import { PresupuestoStitchBento } from '@/components/socio/presupuestos/PresupuestoStitchBento';
import { PresupuestoPrintView } from '@/components/socio/presupuestos/PresupuestoPrintView';
import { ResumenAcumulado } from '@/components/socio/presupuestos/ResumenAcumulado';
import { usePresupuestos } from '@/components/socio/presupuestos/hooks/usePresupuestos';
import { USE_MOCK_DATA, FORCE_PRESUPUESTOS_MOCK, MOCK_OBRAS_PARA_PRESUPUESTOS } from '@/lib/mocks/socioMockData';
import { cn } from '@/lib/utils';
import { bucketEtapaPresupuesto } from '@/lib/socio/bucketEtapaPresupuesto';
import { presupuestoLineaEstado } from '@/lib/socio/presupuestoLineaEstado';
import { presupuestoLineaTieneValoresObligatorios } from '@/lib/socio/presupuestoValores';
import {
  buildPresupuestoPdfBlob,
  downloadPresupuestoPdf,
  openWhatsAppPresupuesto,
  sharePresupuestoPdf,
} from '@/lib/socio/presupuestoPdfShare';

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

function PresupuestosContent() {
  const searchParams = useSearchParams();
  const obraId = searchParams.get('obra_id');
  const { toast } = useToast();
  const currentUser = useCurrentUser();
  const presupuestosUsanMock = USE_MOCK_DATA || FORCE_PRESUPUESTOS_MOCK;
  const stitchPresupuestoUi = presupuestosUsanMock || Boolean(obraId);

  const [obras, setObras] = useState<ObraConPresupuestos[]>([]);
  const [showSolicitarCambio, setShowSolicitarCambio] = useState(false);
  const [solicitudCambioEstado, setSolicitudCambioEstado] = useState<string | null>(null);
  const [loadingObras, setLoadingObras] = useState(false);
  const [nombreContratista, setNombreContratista] = useState<string>('Contratista');

  const [activeEtapa, setActiveEtapa] = useState<'ESTRUCTURA' | 'OBRA_GRIS' | 'TERMINACIONES'>('ESTRUCTURA');
  const [stagePdfPath, setStagePdfPath] = useState<string | null>(null);
  const [planosOpen, setPlanosOpen] = useState(false);
  const [accionesExtraOpen, setAccionesExtraOpen] = useState(false);

  const {
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
      const editData = editing.get(p.tarea_id) || { dias_reales: null, monto: null, observacion: '' };
      if (editData.dias_reales !== null && !isNaN(editData.dias_reales)) {
        totalDias += editData.dias_reales;
      }
      if (editData.monto !== null && !isNaN(editData.monto)) {
        totalMonto += editData.monto;
      }
    });

    return { totalDias: Math.round(totalDias * 10) / 10, totalMonto };
  }, [obraId, presupuestosFiltrados, editing]);

  const progresoPaqueteEtapa = useMemo(() => {
    if (!presupuestosFiltrados.length) {
      return { pct: 0, completas: 0, total: 0 };
    }
    let completas = 0;
    presupuestosFiltrados.forEach((p) => {
      const ed = editing.get(p.tarea_id) || {
        dias_reales: null,
        monto: null,
        observacion: '',
        incluye_materiales: false,
      };
      const { key } = presupuestoLineaEstado(p.estado, {
        monto: ed.monto ?? p.monto,
        dias_reales: ed.dias_reales ?? p.dias_reales,
      });
      if (key === 'lista' || key === 'enviada' || key === 'aprobada') {
        completas++;
      }
    });
    const total = presupuestosFiltrados.length;
    return {
      pct: Math.round((completas / total) * 100),
      completas,
      total,
    };
  }, [presupuestosFiltrados, editing]);

  const estadoObraPresupuestoLabel = useMemo(() => {
    if (!presupuestosFiltrados.length) return '—';
    if (presupuestosFiltrados.every((p) => (p.estado || '').toUpperCase() === 'APROBADO')) {
      return 'Aprobado';
    }
    if (presupuestosFiltrados.every((p) => {
      const e = (p.estado || '').toUpperCase();
      return e === 'ENVIADO' || e === 'APROBADO';
    })) {
      return 'Enviado';
    }
    return 'Borrador';
  }, [presupuestosFiltrados]);

  const hasPresupuestos = presupuestosFiltrados.length > 0;
  const showActions = hasPresupuestos;

  const etapaLabelLarga =
    activeEtapa === 'ESTRUCTURA'
      ? 'Estructura'
      : activeEtapa === 'OBRA_GRIS'
        ? 'Obra gris'
        : 'Terminaciones';

  // Verificar si los presupuestos ya fueron enviados o aprobados
  // Solo considerar enviados si TODOS están enviados o aprobados
  const todosEnviadosOAprobados = presupuestosFiltrados.length > 0 && presupuestosFiltrados.every(
    (p) => p.estado === 'ENVIADO' || p.estado === 'APROBADO'
  );
  const presupuestosAprobados = presupuestosFiltrados.every(
    (p) => p.estado === 'APROBADO'
  );
  const puedeEditar = !presupuestosAprobados; // Solo puede editar si NO todos están aprobados
  const presupuestoAprobadoRef = useMemo(() => {
    const p = presupuestosFiltrados.find((x) => (x.estado || '').toUpperCase() === 'APROBADO');
    if (!p?.id) return null;
    const ed = editing.get(p.tarea_id);
    return {
      id: p.id,
      monto: ed?.monto ?? p.monto ?? 0,
    };
  }, [presupuestosFiltrados, editing]);

  useEffect(() => {
    if (!presupuestoAprobadoRef?.id || presupuestosUsanMock) {
      setSolicitudCambioEstado(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await fetch(
        `/api/socio/presupuestos/solicitudes-cambio?presupuesto_id=${encodeURIComponent(presupuestoAprobadoRef.id)}`,
        { credentials: 'include' },
      );
      const json = await res.json().catch(() => ({}));
      if (cancelled) return;
      const ultima = json.ultima as { estado?: string } | null;
      setSolicitudCambioEstado(ultima?.estado ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [presupuestoAprobadoRef?.id, presupuestosUsanMock]);

  const hayPendientes = presupuestosFiltrados.some(
    (p) => p.estado === 'PENDIENTE' || !p.estado || p.estado === ''
  );

  const puedePublicarEtapa = useMemo(() => {
    const pendientes = presupuestosFiltrados.filter((p) => {
      const e = (p.estado || '').toUpperCase();
      return e !== 'ENVIADO' && e !== 'APROBADO';
    });
    if (pendientes.length === 0) return false;
    return pendientes.every((p) => {
      const ed = editing.get(p.tarea_id) || {
        dias_reales: null,
        monto: null,
        observacion: '',
        incluye_materiales: false,
      };
      return presupuestoLineaTieneValoresObligatorios(ed);
    });
  }, [presupuestosFiltrados, editing]);

  const menuItemClass =
    'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50';

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
      const editData = editing.get(p.tarea_id) || { dias_reales: null, monto: null, observacion: '' };
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

  // Imprimir (usa window.print + estilos @media print sobre PresupuestoPrintView)
  const handlePrintPresupuesto = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!obra || presupuestosFiltrados.length === 0) {
      toast({
        title: 'Sin presupuestos',
        description: 'Cargá al menos una tarea con monto en esta etapa para imprimir.',
        variant: 'destructive',
      });
      return;
    }
    document.body.classList.add('printing-presupuesto');
    const cleanup = () => {
      document.body.classList.remove('printing-presupuesto');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => {
      try {
        window.print();
      } finally {
        // Safari/iOS no siempre dispara afterprint
        setTimeout(cleanup, 1500);
      }
    }, 60);
  }, [obra, presupuestosFiltrados.length, toast]);

  const buildPdfParams = useCallback(() => {
    if (!obra || presupuestosFiltrados.length === 0) return null;
    return {
      obra: {
        id: obra.id,
        name: obra.name || 'Sin nombre',
        direccion_completa: obra.direccion_completa,
        cantidad_plantas: obra.cantidad_plantas,
        fecha_inicio: obra.fecha_inicio,
        cliente: obra.cliente || null,
      },
      presupuestosAgrupadosPorEtapa,
      nombreContratista,
      etapaActiva: activeEtapa,
      editing,
    };
  }, [obra, presupuestosFiltrados.length, presupuestosAgrupadosPorEtapa, nombreContratista, activeEtapa, editing]);

  const pdfFilename = useMemo(() => {
    const slug = (obra?.name || 'presupuesto').replace(/\s+/g, '-').slice(0, 40);
    return `presupuesto-${slug}-${activeEtapa.toLowerCase()}.pdf`;
  }, [obra?.name, activeEtapa]);

  const handleDescargarPDF = useCallback(() => {
    const params = buildPdfParams();
    if (!params) {
      toast({ title: 'Sin presupuestos', description: 'No hay tareas para exportar.', variant: 'destructive' });
      return;
    }
    const blob = buildPresupuestoPdfBlob(params);
    if (!blob) {
      toast({ title: 'Error', description: 'No se pudo generar el PDF.', variant: 'destructive' });
      return;
    }
    downloadPresupuestoPdf(blob, pdfFilename);
    toast({ title: 'PDF descargado', description: pdfFilename });
  }, [buildPdfParams, pdfFilename, toast]);

  const handleCompartirPDF = useCallback(async () => {
    const params = buildPdfParams();
    if (!params) {
      toast({ title: 'Sin presupuestos', description: 'No hay tareas para compartir.', variant: 'destructive' });
      return;
    }
    const blob = buildPresupuestoPdfBlob(params);
    if (!blob) {
      toast({ title: 'Error', description: 'No se pudo generar el PDF.', variant: 'destructive' });
      return;
    }
    try {
      const result = await sharePresupuestoPdf(blob, pdfFilename, `Presupuesto — ${obra?.name ?? 'Obra'}`);
      toast({
        title: result === 'shared' ? 'PDF compartido' : 'PDF descargado',
        description: result === 'shared' ? 'Elegí la app donde enviarlo.' : 'Tu navegador no permite compartir archivos; se descargó localmente.',
      });
    } catch {
      toast({ title: 'No se pudo compartir', variant: 'destructive' });
    }
  }, [buildPdfParams, pdfFilename, obra?.name, toast]);

  const handleWhatsAppPDF = useCallback(async () => {
    const params = buildPdfParams();
    if (!params) {
      toast({ title: 'Sin presupuestos', description: 'No hay tareas para enviar.', variant: 'destructive' });
      return;
    }
    const blob = buildPresupuestoPdfBlob(params);
    if (!blob) {
      toast({ title: 'Error', description: 'No se pudo generar el PDF.', variant: 'destructive' });
      return;
    }
    const total = presupuestosFiltrados.reduce((acc, p) => {
      const ed = editing.get(p.tarea_id);
      return acc + (ed?.monto ?? p.monto ?? 0);
    }, 0);
    const msg = [
      `Presupuesto — ${obra?.name ?? 'Obra'}`,
      `Etapa: ${etapaLabelLarga}`,
      `Contratista: ${nombreContratista}`,
      `Total etapa: $${total.toLocaleString('es-AR')}`,
      '',
      'Te comparto el PDF del presupuesto. Si no se adjunta automáticamente, pedime que te lo reenvíe.',
    ].join('\n');
    try {
      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
        const file = new File([blob], pdfFilename, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ title: 'Presupuesto Grows', text: msg, files: [file] });
          return;
        }
      }
    } catch {
      /* fallback WhatsApp texto */
    }
    downloadPresupuestoPdf(blob, pdfFilename);
    openWhatsAppPresupuesto(`${msg}\n\n(PDF descargado: ${pdfFilename})`);
  }, [buildPdfParams, presupuestosFiltrados, editing, obra?.name, etapaLabelLarga, nombreContratista, pdfFilename, toast]);

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
          stitchPresupuestoUi && 'bg-stitch-surface font-stitch-body',
        )}
      >
        <div
          className={cn(
            'flex items-center gap-2',
            stitchPresupuestoUi ? 'text-stitch-primary' : 'text-slate-500',
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
          stitchPresupuestoUi && 'bg-stitch-surface font-stitch-body',
        )}
      >
        <div className="text-center">
          <h2
            className={cn(
              'text-base font-semibold',
              stitchPresupuestoUi ? 'font-stitch-headline text-stitch-primary' : 'text-slate-900',
            )}
          >
            Obra no encontrada
          </h2>
          <p
            className={cn('mt-2 text-sm', stitchPresupuestoUi ? 'text-stitch-on-surface/70' : 'text-slate-500')}
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
        'min-h-screen',
        showActions && 'pb-[calc(var(--socio-tab-h,4.25rem)+13.5rem)]',
        stitchPresupuestoUi
          ? 'bg-[#f7f9fb] font-stitch-body text-stitch-on-surface'
          : 'bg-slate-50',
      )}
    >
      {obraId && obra && (
        <section className="border-b border-[#163274]/8 bg-white px-4 py-5">
          <div className="mx-auto flex max-w-2xl flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#43617c]">Paquete</p>
                <h1 className="font-stitch-headline text-xl font-extrabold leading-tight text-[#163274]">
                  {etapaLabelLarga}
                </h1>
                <p className="mt-1 text-sm font-semibold text-[#191c1e]">{obra.name || 'Obra'}</p>
                {obra.direccion_completa ? (
                  <p className="mt-1 flex items-start gap-1 text-xs text-slate-500">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="line-clamp-2">{obra.direccion_completa}</span>
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <span className="rounded-full bg-[#163274] px-3 py-1 text-center text-[10px] font-bold uppercase tracking-wide text-white">
                  {estadoObraPresupuestoLabel}
                </span>
                <button
                  type="button"
                  onClick={() => setPlanosOpen(true)}
                  className="text-[11px] font-bold text-[#163274] underline-offset-2 hover:underline"
                >
                  Ver planos
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-[#43617c]">
              <span>
                <span className="font-bold text-[#163274]">{presupuestosFiltrados.length}</span> partidas
              </span>
              {hasPresupuestos ? (
                <span>
                  Progreso{' '}
                  <span className="font-bold tabular-nums text-[#163274]">
                    {progresoPaqueteEtapa.completas}/{progresoPaqueteEtapa.total}
                  </span>
                </span>
              ) : null}
            </div>
            {hasPresupuestos ? (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#163274] transition-all duration-500"
                  style={{ width: `${progresoPaqueteEtapa.pct}%` }}
                />
              </div>
            ) : null}
          </div>
        </section>
      )}

      {hasPresupuestos && (
        <div className="px-4 pt-4">
          <PresupuestoStitchBento
            titulo={obra.name || 'Obra'}
            totalMonto={totales.totalMonto}
            totalDias={totales.totalDias}
            partidasEnEtapa={presupuestosFiltrados.length}
            partidasCompletas={progresoPaqueteEtapa.completas}
            estadoPaquete={estadoObraPresupuestoLabel}
            variant={stitchPresupuestoUi ? 'stitch' : 'slate'}
            isDemo={presupuestosUsanMock}
          />
        </div>
      )}

      {/* Botones de etapa */}
      <EtapasButtons
        activeEtapa={activeEtapa}
        onEtapaChange={setActiveEtapa}
        counts={etapaCounts}
        stitchMode={stitchPresupuestoUi}
      />

      {/* Lista de tareas */}
      {hasPresupuestos ? (
        <ListaTareas
          presupuestos={presupuestosFiltrados}
          canvasNodesRaw={canvasNodes}
          canvasBudgetGroups={canvasBudgetGroups}
          onFieldChange={onFieldChange}
          editing={editing}
          stitchMode={stitchPresupuestoUi}
        />
      ) : (
        <div className="px-4 py-12 text-center">
          <p
            className={cn(
              'text-sm',
              stitchPresupuestoUi ? 'text-stitch-on-surface/70' : 'text-slate-500',
            )}
          >
            No hay tareas para la etapa {activeEtapa.toLowerCase()}.
          </p>
        </div>
      )}

      {obra && (
        <ModalVerPlanos open={planosOpen} onClose={() => setPlanosOpen(false)} obraId={obra.id} />
      )}

      {/* Vista de impresión (oculta en pantalla, visible en @media print) */}
      {obra && (
        <div className="print-only-presupuesto" aria-hidden="true">
          <PresupuestoPrintView
            obra={{ name: obra.name }}
            presupuestos={presupuestosFiltrados.map((p) => ({
              tarea_id: p.tarea_id,
              tarea: p.tarea ? { title: p.tarea.title } : null,
              elemento: p.elemento ? { nombre: p.elemento.nombre } : null,
            }))}
            etapaLabel={etapaLabelLarga}
          />
        </div>
      )}

      {/* Barra inferior: anclada encima del TabBar socio (variable --socio-tab-h en layout). */}
      {showActions && (
        <div
          className={cn(
            'fixed left-0 right-0 z-30 mx-auto w-full max-w-lg border-t bg-white/98 backdrop-blur-md',
            'bottom-[var(--socio-tab-h,4.25rem)] shadow-[0_-6px_24px_rgba(22,50,116,0.08)]',
            stitchPresupuestoUi ? 'border-[#163274]/10' : 'border-slate-200',
          )}
        >
          <ResumenAcumulado
            totalDias={totales.totalDias}
            totalMonto={totales.totalMonto}
            cantidadTareas={presupuestosFiltrados.length}
            partidasCompletas={progresoPaqueteEtapa.completas}
            partidasTotal={progresoPaqueteEtapa.total}
            stitchMode={stitchPresupuestoUi}
          />
          <div className="flex flex-col gap-2 px-3 pb-3 pt-0">
            {hayPendientes || !todosEnviadosOAprobados ? (
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={() =>
                    handleSendPresupuesto(
                      presupuestosFiltrados,
                      presupuestosAgrupadosPorEtapa,
                      nombreContratista,
                      activeEtapa,
                    )
                  }
                  disabled={saving || !puedePublicarEtapa}
                  loading={saving}
                  className="h-12 min-w-0 flex-1 rounded-2xl text-base font-bold"
                  size="sm"
                >
                  <Send className="mr-2 h-4 w-4 shrink-0" />
                  Publicar
                </Button>
                <div className="relative shrink-0">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={saving}
                    className="h-12 w-12 rounded-2xl px-0"
                    size="sm"
                    aria-label="Más opciones"
                    onClick={() => setAccionesExtraOpen((v) => !v)}
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                  {accionesExtraOpen ? (
                    <div className="absolute bottom-full right-0 z-40 mb-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                      <button
                        type="button"
                        className={menuItemClass}
                        disabled={saving}
                        onClick={() => {
                          setAccionesExtraOpen(false);
                          void handleSaveDraft(presupuestosFiltrados);
                        }}
                      >
                        <Save className="h-4 w-4 text-slate-500" />
                        Guardar borrador
                      </button>
                      <button type="button" className={menuItemClass} disabled={saving} onClick={() => { setAccionesExtraOpen(false); void handleGenerarPDF(); }}>
                        <FileText className="h-4 w-4 text-slate-500" />
                        Generar PDF
                      </button>
                      <button type="button" className={menuItemClass} disabled={saving} onClick={() => { setAccionesExtraOpen(false); handlePrintPresupuesto(); }}>
                        <Printer className="h-4 w-4 text-slate-500" />
                        Imprimir
                      </button>
                      <button type="button" className={menuItemClass} disabled={saving} onClick={() => { setAccionesExtraOpen(false); handleDescargarPDF(); }}>
                        <Download className="h-4 w-4 text-slate-500" />
                        Descargar PDF
                      </button>
                      <button type="button" className={menuItemClass} disabled={saving} onClick={() => { setAccionesExtraOpen(false); void handleCompartirPDF(); }}>
                        <Share2 className="h-4 w-4 text-slate-500" />
                        Compartir
                      </button>
                      <button type="button" className={menuItemClass} disabled={saving} onClick={() => { setAccionesExtraOpen(false); void handleWhatsAppPDF(); }}>
                        <MessageCircle className="h-4 w-4 text-slate-500" />
                        WhatsApp
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                {(stagePdfPath || pdfPath) ? (
                  <Button
                    variant="primary"
                    onClick={handleVerPDFEnviado}
                    disabled={saving}
                    className="h-12 min-w-0 flex-1 rounded-2xl font-bold"
                    size="sm"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver PDF enviado
                  </Button>
                ) : (
                  <p className="flex h-12 min-w-0 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-3 text-center text-xs font-semibold text-slate-600">
                    Presupuesto publicado
                  </p>
                )}
                <div className="relative shrink-0">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={saving}
                    className="h-12 w-12 rounded-2xl px-0"
                    size="sm"
                    aria-label="Más opciones"
                    onClick={() => setAccionesExtraOpen((v) => !v)}
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                  {accionesExtraOpen ? (
                    <div className="absolute bottom-full right-0 z-40 mb-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                      <button type="button" className={menuItemClass} disabled={saving} onClick={() => { setAccionesExtraOpen(false); handlePrintPresupuesto(); }}>
                        <Printer className="h-4 w-4 text-slate-500" />
                        Imprimir
                      </button>
                      <button type="button" className={menuItemClass} disabled={saving} onClick={() => { setAccionesExtraOpen(false); handleDescargarPDF(); }}>
                        <Download className="h-4 w-4 text-slate-500" />
                        Descargar PDF
                      </button>
                      <button type="button" className={menuItemClass} disabled={saving} onClick={() => { setAccionesExtraOpen(false); void handleCompartirPDF(); }}>
                        <Share2 className="h-4 w-4 text-slate-500" />
                        Compartir
                      </button>
                      {puedeEditar ? (
                        <button type="button" className={menuItemClass} disabled={saving} onClick={() => { setAccionesExtraOpen(false); void handleEliminarPDFYEditar(); }}>
                          <Edit className="h-4 w-4 text-slate-500" />
                          Editar de nuevo
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
            {hayPendientes || !todosEnviadosOAprobados ? (
              !puedePublicarEtapa && !saving ? (
                <p className="text-center text-[11px] font-medium text-amber-800">
                  Completá días y precio en todas las partidas para habilitar Publicar.
                </p>
              ) : null
            ) : null}
            {presupuestosAprobados && presupuestoAprobadoRef ? (
                  solicitudCambioEstado === 'pendiente' ? (
                    <p className="flex-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-900">
                      Solicitud de cambio en revisión por el cliente
                    </p>
                  ) : solicitudCambioEstado === 'aceptado' ? (
                    <p className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-900">
                      El cliente aceptó tu última solicitud de precio
                    </p>
                  ) : solicitudCambioEstado === 'rechazado' ? (
                    <Button
                      variant="secondary"
                      onClick={() => setShowSolicitarCambio(true)}
                      disabled={saving}
                      className="flex-1"
                      size="sm"
                    >
                      <Scale className="h-4 w-4 mr-2" />
                      Nueva solicitud de precio
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => setShowSolicitarCambio(true)}
                      disabled={saving}
                      className="flex-1"
                      size="sm"
                    >
                      <Scale className="h-4 w-4 mr-2" />
                      Solicitar cambio de precio
                    </Button>
                  )
                ) : null}
          </div>
        </div>
      )}
      {presupuestoAprobadoRef && (
        <SolicitarCambioPresupuestoModal
          open={showSolicitarCambio}
          onClose={() => setShowSolicitarCambio(false)}
          presupuestoId={presupuestoAprobadoRef.id}
          montoActual={presupuestoAprobadoRef.monto}
          onSuccess={() => setSolicitudCambioEstado('pendiente')}
        />
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
