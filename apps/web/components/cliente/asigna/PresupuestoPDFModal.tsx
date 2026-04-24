'use client';

import { useEffect, useState, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Download, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/grows';
import { generarPresupuestoPDFBytes } from '@/lib/pdf/generarPresupuestoPDF';

interface PresupuestoInfo {
  id: string;
  tarea_id: string;
  tarea_titulo: string;
  cuadrilla_nombre: string;
  monto: number | null;
  moneda: string | null;
  estado: string | null;
  notas: string | null;
  duracion_estimada?: number | null;
  duracion_ofrecida?: number | null;
  created_at: string;
  updated_at?: string | null;
}

interface PresupuestoPDFModalProps {
  open: boolean;
  onClose: () => void;
  cuadrillaNombre: string;
  presupuestos: PresupuestoInfo[];
  /** En demo: solo el primer socio tiene PDF; mostrar documento de ejemplo sin API. */
  isDemoPdf?: boolean;
}

export function PresupuestoPDFModal({
  open,
  onClose,
  cuadrillaNombre,
  presupuestos,
  isDemoPdf = false,
}: PresupuestoPDFModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!open) {
      setPdfUrl(null);
      setError(null);
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      return;
    }

    if (isDemoPdf) {
      setLoading(true);
      setError(null);
      try {
        const obra = {
          id: 'demo-obra-1-casa-familiar',
          name: 'CLIENTE POR DEFECTO (nueva)',
          direccion_completa: 'Obra Casa Familiar – Demo',
          cantidad_plantas: 2,
          fecha_inicio: new Date().toISOString().split('T')[0],
          cliente: 'Cliente por defecto',
        };
        const items =
          presupuestos.length > 0
            ? presupuestos.map((p) => ({
                id: p.id,
                tarea_id: p.tarea_id,
                estado: p.estado ?? 'PENDIENTE',
                dias_reales: p.duracion_ofrecida ?? p.duracion_estimada ?? 5,
                monto: p.monto ?? 0,
                tarea: {
                  id: p.tarea_id,
                  title: p.tarea_titulo,
                  etapa: null,
                  duracion_sugerida: null,
                },
                elemento: null,
              }))
            : [
                {
                  id: 'demo-1',
                  tarea_id: 'demo-t1',
                  estado: 'PENDIENTE',
                  dias_reales: 5,
                  monto: 125000,
                  tarea: { id: 'demo-t1', title: 'Replanteo y límites', etapa: null, duracion_sugerida: null },
                  elemento: null,
                },
                {
                  id: 'demo-2',
                  tarea_id: 'demo-t2',
                  estado: 'PENDIENTE',
                  dias_reales: 4,
                  monto: 118000,
                  tarea: { id: 'demo-t2', title: 'Excavación de fundación', etapa: null, duracion_sugerida: null },
                  elemento: null,
                },
                {
                  id: 'demo-3',
                  tarea_id: 'demo-t3',
                  estado: 'PENDIENTE',
                  dias_reales: 6,
                  monto: 132000,
                  tarea: { id: 'demo-t3', title: 'Hormigón de cimientos', etapa: null, duracion_sugerida: null },
                  elemento: null,
                },
              ];
        const presupuestosAgrupadosPorEtapa = {
          ESTRUCTURA: items,
          OBRA_GRIS: [] as typeof items,
          TERMINACIONES: [] as typeof items,
        };
        const bytes = generarPresupuestoPDFBytes({
          obra,
          presupuestosAgrupadosPorEtapa,
          nombreContratista: cuadrillaNombre,
          fechaGeneracion: new Date(),
          etapaActiva: 'ESTRUCTURA',
        });
        if (bytes && bytes.length > 0) {
          if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
          const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          blobUrlRef.current = url;
          setPdfUrl(url);
        } else {
          setError('No se pudo generar el PDF de ejemplo.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al generar el PDF de ejemplo.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (presupuestos.length === 0) {
      setPdfUrl(null);
      setError(null);
      setLoading(false);
      return;
    }

    const fetchPdfPath = async () => {
      setLoading(true);
      setError(null);

      try {
        const tareaIds = presupuestos.map((p) => p.tarea_id).filter(Boolean);
        const searchParams = new URLSearchParams();
        if (tareaIds.length > 0) {
          searchParams.set('tarea_ids', tareaIds.join(','));
        }

        const res = await fetch(`/api/presupuestos/pdf?${searchParams.toString()}`, {
          method: 'GET',
          cache: 'no-store',
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.pdf_path) {
          setError(
            json?.error ||
              'No se encontró el PDF para este presupuesto. El socio aún no ha generado el documento.',
          );
          setLoading(false);
          return;
        }

        const pdfPath: string = json.pdf_path;
        const pathSinPrefijo = pdfPath.startsWith('actas/') ? pdfPath.replace('actas/', '') : pdfPath;
        
        // Intentar obtener URL pública primero
        const { data: urlData } = supabase.storage.from('actas').getPublicUrl(pathSinPrefijo);
        
        if (urlData?.publicUrl) {
          // Verificar si la URL pública funciona (bucket público)
          setPdfUrl(urlData.publicUrl);
        } else {
          // Si no hay URL pública, generar URL firmada (bucket privado)
          const { data: signedUrlData, error: signedError } = await supabase.storage
            .from('actas')
            .createSignedUrl(pathSinPrefijo, 3600); // URL válida por 1 hora
          
          if (signedError || !signedUrlData?.signedUrl) {
            console.error('[PresupuestoPDFModal] Error generando URL firmada:', signedError);
            setError('No se pudo obtener la URL del PDF.');
          } else {
            setPdfUrl(signedUrlData.signedUrl);
          }
        }
      } catch (err) {
        console.error('[PresupuestoPDFModal] Error:', err);
        setError('Error al cargar el PDF. Por favor, intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    void fetchPdfPath();
  }, [open, presupuestos, supabase, isDemoPdf]);

  const handleDownload = () => {
    if (!pdfUrl) return;

    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `Presupuesto_${cuadrillaNombre}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Presupuesto PDF - {cuadrillaNombre}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              <span className="ml-2 text-sm text-slate-600">Cargando PDF...</span>
            </div>
          )}

          {error && (
            <div className="py-12 text-center">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {!loading && !error && pdfUrl && (
            <div className="space-y-4">
              {isDemoPdf && (
                <p className="text-xs text-slate-500 text-center">Documento de ejemplo generado con el mismo formato que la app de socios.</p>
              )}
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                <iframe
                  src={pdfUrl}
                  className="w-full h-[600px] border-0"
                  title="Presupuesto PDF"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  icon={<Download className="h-4 w-4" />}
                  onClick={handleDownload}
                >
                  Descargar PDF
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
