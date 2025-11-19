'use client';

import { Eye, Trash2, Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { DocumentoLegajo } from '@/lib/supabase/legajo-client';

interface LegajoCardProps {
  categoriaId: string;
  categoriaNombre: string;
  descripcion?: string | null;
  documentos: DocumentoLegajo[];
  onAgregarDocumento: () => void;
  onEliminarDocumento: (documentoId: string, url: string) => Promise<void>;
  onVerDocumento: (url: string) => void;
  isDestacado?: boolean;
}

export default function LegajoCard({
  categoriaNombre,
  descripcion,
  documentos,
  onAgregarDocumento,
  onEliminarDocumento,
  onVerDocumento,
  isDestacado = false,
}: LegajoCardProps) {
  const tieneDocumentos = documentos.length > 0;

  const formatFileSize = (bytes: number) => {
    // No tenemos el tamaño en el tipo, pero podemos mostrar la fecha
    return '';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isDestacado) {
    return (
      <Card className="p-6 border-2 border-sky-300 bg-gradient-to-br from-sky-50 to-white rounded-xl shadow-md hover:shadow-lg transition-all">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{categoriaNombre}</h3>
            {descripcion && (
              <p className="text-sm text-slate-600 mt-1">{descripcion}</p>
            )}
          </div>
          <span className="text-base font-semibold text-sky-700 px-3 py-1 rounded-full bg-sky-100">
            {documentos.length} {documentos.length === 1 ? 'documento' : 'documentos'}
          </span>
        </div>

        {tieneDocumentos ? (
          <ul className="space-y-2 mb-4">
            {documentos.map((documento) => (
              <li
                key={documento.id}
                className="flex justify-between items-center border-2 border-sky-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white hover:bg-sky-50 transition"
              >
                <div className="flex-1 min-w-0">
                  <span className="truncate block font-medium">{documento.nombre_archivo}</span>
                  <span className="text-xs text-slate-500">
                    {formatDate(documento.created_at)}
                    {documento.descripcion && ` - ${documento.descripcion}`}
                  </span>
                </div>
                <div className="flex items-center gap-1 ml-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onVerDocumento(documento.url)}
                    className="h-8 px-3 text-sky-700 hover:text-sky-800 hover:bg-sky-100"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEliminarDocumento(documento.id, documento.url)}
                    className="h-8 px-3 text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mb-4 p-4 bg-white rounded-lg border-2 border-dashed border-sky-300">
            <p className="text-slate-500 text-center">
              No hay documentos cargados
            </p>
          </div>
        )}

        <Button
          variant="default"
          size="default"
          onClick={onAgregarDocumento}
          className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-md py-2.5"
        >
          <Plus className="h-5 w-5 mr-2" />
          Agregar documento
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-5 border border-slate-200 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-center mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-700 truncate">{categoriaNombre}</h3>
          {descripcion && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{descripcion}</p>
          )}
        </div>
        <span className="text-sm text-slate-500 ml-2 whitespace-nowrap">
          {documentos.length} {documentos.length === 1 ? 'doc' : 'docs'}
        </span>
      </div>

      {tieneDocumentos ? (
        <ul className="space-y-1 mb-3 max-h-48 overflow-y-auto">
          {documentos.map((documento) => (
            <li
              key={documento.id}
              className="flex justify-between items-center border rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50 transition"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3 w-3 text-slate-400 flex-shrink-0" />
                  <span className="truncate block">{documento.nombre_archivo}</span>
                </div>
                <span className="text-xs text-slate-400">
                  {formatDate(documento.created_at)}
                </span>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onVerDocumento(documento.url)}
                  className="h-7 px-2 text-sky-700 hover:text-sky-800"
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEliminarDocumento(documento.id, documento.url)}
                  className="h-7 px-2 text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-slate-400 text-sm mb-4">
          No hay documentos cargados
        </p>
      )}

      <Button
        variant="default"
        size="sm"
        onClick={onAgregarDocumento}
        className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-md"
      >
        <Plus className="h-4 w-4 mr-1" />
        Agregar
      </Button>
    </Card>
  );
}

