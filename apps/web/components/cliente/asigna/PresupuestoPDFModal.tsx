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
  }, [open, presupuestos, supabase]);

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
