'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Download, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/grows';

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
}

export function PresupuestoPDFModal({
  open,
  onClose,
  cuadrillaNombre,
  presupuestos,
}: PresupuestoPDFModalProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!open || presupuestos.length === 0) {
      setPdfUrl(null);
      setError(null);
      return;
    }

    const fetchPdfPath = async () => {
      setLoading(true);
      setError(null);

      try {
        // Obtener el pdf_path desde eventos relacionados con las tareas del presupuesto
        // Buscamos eventos que tengan pdf_path para alguna de las tareas
        const tareaIds = presupuestos.map((p) => p.tarea_id);

        // Intentar obtener eventos con pdf_path para estas tareas
        const { data: eventos, error: eventosError } = await supabase
          .from('eventos')
          .select('pdf_path, tarea_id')
          .in('tarea_id', tareaIds)
          .not('pdf_path', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1);

        if (eventosError) {
          console.error('[PresupuestoPDFModal] Error fetching eventos:', eventosError);
          // Si no hay eventos, intentar buscar en otra tabla o usar un path por defecto
        }

        let pdfPath: string | null = null;

        if (eventos && eventos.length > 0 && eventos[0].pdf_path) {
          pdfPath = eventos[0].pdf_path;
        } else {
          // Si no encontramos en eventos, intentar construir el path desde el presupuesto
          // El PDF podría estar en media.path o en otra estructura
          // Por ahora, intentamos buscar en la tabla de eventos con un patrón diferente
          const { data: eventosAlt } = await supabase
            .from('eventos')
            .select('pdf_path, tarea_id')
            .in('tarea_id', tareaIds)
            .order('created_at', { ascending: false })
            .limit(10);

          if (eventosAlt && eventosAlt.length > 0) {
            const eventoConPdf = eventosAlt.find((e) => e.pdf_path);
            if (eventoConPdf?.pdf_path) {
              pdfPath = eventoConPdf.pdf_path;
            }
          }
        }

        if (!pdfPath) {
          setError('No se encontró el PDF para este presupuesto. El socio aún no ha generado el documento.');
          setLoading(false);
          return;
        }

        // Obtener URL pública del PDF desde Supabase Storage
        // El PDF está en el bucket 'actas'
        const pathSinPrefijo = pdfPath.startsWith('actas/') ? pdfPath.replace('actas/', '') : pdfPath;
        const { data: urlData } = supabase.storage.from('actas').getPublicUrl(pathSinPrefijo);

        if (urlData?.publicUrl) {
          setPdfUrl(urlData.publicUrl);
        } else {
          setError('No se pudo obtener la URL del PDF.');
        }
      } catch (err) {
        console.error('[PresupuestoPDFModal] Error:', err);
        setError('Error al cargar el PDF. Por favor, intentá nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    void fetchPdfPath();
  }, [open, presupuestos, supabase]);

  const handleDownload = () => {
    if (!pdfUrl) return;

    // Crear un enlace temporal para descargar
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

