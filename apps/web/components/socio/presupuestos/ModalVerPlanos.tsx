'use client';

import { useState, useEffect } from 'react';
import { X, FileText, Download, Eye, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/grows/Button';

interface Plano {
  id: string;
  nombre_archivo: string;
  url: string;
  categoria: string;
  created_at: string;
}

interface ModalVerPlanosProps {
  open: boolean;
  onClose: () => void;
  obraId: string;
}

export function ModalVerPlanos({ open, onClose, obraId }: ModalVerPlanosProps) {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(false);
  const [planoSeleccionado, setPlanoSeleccionado] = useState<Plano | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && obraId) {
      fetchPlanos();
    }
  }, [open, obraId]);

  const fetchPlanos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/socio/obras/${obraId}/planos`);
      if (!response.ok) {
        throw new Error('Error al cargar planos');
      }
      const data = await response.json();
      setPlanos(data.planos || []);
    } catch (err) {
      console.error('[ModalVerPlanos] Error:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar planos');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleVer = (plano: Plano) => {
    setPlanoSeleccionado(plano);
  };

  const handleDescargar = (plano: Plano) => {
    window.open(plano.url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Planos de la obra
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-sm text-red-600">{error}</div>
          ) : planos.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-500">
              No hay planos disponibles para esta obra.
            </div>
          ) : (
            <>
              {/* Lista de planos */}
              <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg">
                <div className="divide-y divide-slate-100">
                  {planos.map((plano) => (
                    <div
                      key={plano.id}
                      className="p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="h-5 w-5 text-slate-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {plano.nombre_archivo}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {new Date(plano.created_at).toLocaleDateString('es-AR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleVer(plano)}
                            className="flex items-center gap-1.5"
                          >
                            <Eye className="h-4 w-4" />
                            Ver
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDescargar(plano)}
                            className="flex items-center gap-1.5"
                          >
                            <Download className="h-4 w-4" />
                            Descargar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visor de PDF */}
              {planoSeleccionado && (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">
                      {planoSeleccionado.nombre_archivo}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPlanoSeleccionado(null)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="h-96 bg-slate-100">
                    <iframe
                      src={planoSeleccionado.url}
                      className="w-full h-full"
                      title={planoSeleccionado.nombre_archivo}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

