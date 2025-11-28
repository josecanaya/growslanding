'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { X, FileText, Download, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import type { Database } from '@/lib/types/supabase.gen';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Plano {
  id: string;
  nombre_archivo: string;
  url: string;
  categoria: string;
  created_at: string;
}

function PlanosPageContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const supabase = createClientComponentClient<Database>();
  
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [planoSeleccionado, setPlanoSeleccionado] = useState<Plano | null>(null);
  const [zoom, setZoom] = useState(1);
  const [obraId, setObraId] = useState<string | null>(null);

  useEffect(() => {
    const cargarDatos = async () => {
      if (!id) return;

      try {
        let obraIdFinal: string | null = null;

        // Intentar primero como obra_id
        const { data: obraData } = await (supabase as any)
          .from('obras')
          .select('id')
          .eq('id', id)
          .maybeSingle();

        if (obraData) {
          // Es un obra_id
          obraIdFinal = id;
        } else {
          // No es una obra, intentar como tarea_id
          const { data: tareaData } = await (supabase as any)
            .from('tareas')
            .select('obra_id')
            .eq('id', id)
            .maybeSingle();

          if (tareaData?.obra_id) {
            obraIdFinal = tareaData.obra_id;
          }
        }

        if (!obraIdFinal) {
          console.warn('[PlanosPage] No se pudo determinar obra_id desde el ID:', id);
          setLoading(false);
          return;
        }

        setObraId(obraIdFinal);
        
        // Cargar planos de la obra usando la API (que usa documentos_legajo)
        const response = await fetch(`/api/socio/obras/${obraIdFinal}/planos`);
        
        if (response.ok) {
          const data = await response.json();
          setPlanos(data.planos || []);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('[PlanosPage] Error cargando planos desde API:', {
            status: response.status,
            error: errorData,
          });
        }
      } catch (err) {
        console.error('[PlanosPage] Error cargando planos:', err);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [id, supabase]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleDescargar = (plano: Plano) => {
    window.open(plano.url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#4A6FA5]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Planos de la obra</h1>
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {planos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay planos disponibles para esta obra</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {planos.map((plano) => (
              <div
                key={plano.id}
                className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setPlanoSeleccionado(plano)}
              >
                <FileText className="h-8 w-8 text-[#4A6FA5] mb-2" />
                <h3 className="font-semibold text-gray-900 mb-1 truncate">
                  {plano.nombre_archivo}
                </h3>
                <p className="text-xs text-gray-500">
                  {plano.categoria ? `${plano.categoria} • ` : ''}{new Date(plano.created_at).toLocaleDateString('es-AR')}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Visor de plano con zoom */}
        {planoSeleccionado && (
          <Dialog open={true} onOpenChange={() => setPlanoSeleccionado(null)}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {planoSeleccionado.nombre_archivo}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomOut}
                      disabled={zoom <= 0.5}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600 min-w-[60px] text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomIn}
                      disabled={zoom >= 3}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDescargar(planoSeleccionado)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-auto bg-gray-100 p-4">
                <div
                  className="mx-auto"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top center',
                    width: `${100 / zoom}%`,
                  }}
                >
                  {planoSeleccionado.url.endsWith('.pdf') ? (
                    <iframe
                      src={planoSeleccionado.url}
                      className="w-full border-0"
                      style={{ height: '800px' }}
                      title={planoSeleccionado.nombre_archivo}
                    />
                  ) : (
                    <img
                      src={planoSeleccionado.url}
                      alt={planoSeleccionado.nombre_archivo}
                      className="w-full h-auto"
                      style={{ maxHeight: '800px', objectFit: 'contain' }}
                    />
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

export default function PlanosPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#4A6FA5]" />
      </div>
    }>
      <PlanosPageContent />
    </Suspense>
  );
}

