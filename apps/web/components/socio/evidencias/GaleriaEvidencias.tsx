'use client';

import { useState } from 'react';
import { Calendar, User, X } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Evidencia } from '@/lib/services/evidencias';

interface GaleriaEvidenciasProps {
  evidencias: Evidencia[];
  loading?: boolean;
}

export function GaleriaEvidencias({ evidencias, loading }: GaleriaEvidenciasProps) {
  const [imagenAmpliada, setImagenAmpliada] = useState<Evidencia | null>(null);
  const supabase = createClientComponentClient();

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Obtener URL de la imagen desde Supabase Storage o URL pública directa
  const getImageUrl = (path: string) => {
    if (/^https?:\/\//i.test(path)) return path;
    const bucket = 'evidencias';
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando evidencias...</p>
        </div>
      </div>
    );
  }

  if (evidencias.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📷</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay evidencias</h3>
        <p className="text-gray-600">Aún no se han subido evidencias para esta obra.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {evidencias.map((evidencia) => {
          const imageUrl = getImageUrl(evidencia.path);
          
          return (
            <div
              key={evidencia.id}
              onClick={() => setImagenAmpliada(evidencia)}
              className="bg-white rounded-xl border-2 border-blue-600 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              style={{ borderColor: '#0A4D68' }}
            >
              {/* Miniatura */}
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={evidencia.tarea_nombre || 'Evidencia'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Si falla la carga, mostrar placeholder
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="14"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <span className="text-gray-400 text-sm">Sin imagen</span>
                  </div>
                )}
              </div>

              {/* Información */}
              <div className="p-3 space-y-2">
                <h4 className="font-semibold text-sm text-gray-900 line-clamp-2">
                  {evidencia.tarea_nombre || 'Sin nombre'}
                </h4>
                
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{formatearFecha(evidencia.created_at)}</span>
                </div>

                {evidencia.subido_por_email && (
                  <div className="flex items-center text-xs text-gray-500">
                    <User className="h-3 w-3 mr-1" />
                    <span className="truncate">{evidencia.subido_por_email}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de imagen ampliada */}
      {imagenAmpliada && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setImagenAmpliada(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh]">
            {/* Botón cerrar */}
            <button
              onClick={() => setImagenAmpliada(null)}
              className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors"
            >
              <X className="h-6 w-6 text-gray-900" />
            </button>

            {/* Imagen */}
            <div className="bg-white rounded-lg overflow-hidden">
              <img
                src={getImageUrl(imagenAmpliada.path)}
                alt={imagenAmpliada.tarea_nombre || 'Evidencia'}
                className="w-full h-auto max-h-[80vh] object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="16"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                }}
              />
              
              {/* Información de la imagen */}
              <div className="p-4 bg-white border-t">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  {imagenAmpliada.tarea_nombre || 'Sin nombre'}
                </h3>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{formatearFecha(imagenAmpliada.created_at)}</span>
                  </div>
                  {imagenAmpliada.subido_por_email && (
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      <span>{imagenAmpliada.subido_por_email}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {imagenAmpliada.kind}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

