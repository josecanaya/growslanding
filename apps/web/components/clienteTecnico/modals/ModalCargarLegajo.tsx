'use client';

import { useState } from 'react';
import { X, Upload, FileText, Check, AlertCircle } from 'lucide-react';

interface ModalCargarLegajoProps {
  obraId: string;
  obraNombre: string;
  onClose: () => void;
  onUpload: (archivos: File[]) => void;
}

export function ModalCargarLegajo({ obraId, obraNombre, onClose, onUpload }: ModalCargarLegajoProps) {
  const [archivos, setArchivos] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const nuevosArchivos = Array.from(e.dataTransfer.files);
      setArchivos(prev => [...prev, ...nuevosArchivos]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const nuevosArchivos = Array.from(e.target.files);
      setArchivos(prev => [...prev, ...nuevosArchivos]);
    }
  };

  const removeFile = (index: number) => {
    setArchivos(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (archivos.length === 0) return;

    setUploading(true);
    try {
      await onUpload(archivos);
      onClose();
    } catch (error) {
      console.error('Error al subir archivos:', error);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-claro px-6 py-4 border-b border-claro flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-primario">Cargar Legajo Técnico</h3>
            <p className="text-sm text-primario/70">Obra: {obraNombre}</p>
          </div>
          <button
            onClick={onClose}
            className="text-primario/70 hover:text-primario transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Información */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">Información importante</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Sube los documentos del legajo técnico de esta obra. Formatos permitidos: PDF, DOC, DOCX, JPG, PNG.
                  Tamaño máximo por archivo: 10MB.
                </p>
              </div>
            </div>
          </div>

          {/* Zona de carga */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
              dragActive
                ? 'border-primario bg-primario/5'
                : 'border-gray-300 hover:border-primario/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-primario mb-2">
              Arrastra archivos aquí o haz clic para seleccionar
            </h4>
            <p className="text-sm text-primario/70 mb-4">
              Puedes subir múltiples archivos a la vez
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="bg-primario text-white px-6 py-2 rounded-lg font-medium hover:bg-primario/90 transition-colors duration-200 cursor-pointer inline-block"
            >
              Seleccionar archivos
            </label>
          </div>

          {/* Lista de archivos */}
          {archivos.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-primario">Archivos seleccionados ({archivos.length})</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {archivos.map((archivo, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-primario" />
                      <div>
                        <p className="text-sm font-medium text-primario">{archivo.name}</p>
                        <p className="text-xs text-primario/70">{formatFileSize(archivo.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 transition-colors duration-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex space-x-3 pt-4 border-t border-claro">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-claro text-primario py-3 px-4 rounded-lg font-medium hover:bg-claro/80 transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleUpload}
              disabled={archivos.length === 0 || uploading}
              className="flex-1 bg-primario text-white py-3 px-4 rounded-lg font-medium hover:bg-primario/90 transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Subiendo...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Subir {archivos.length} archivo{archivos.length !== 1 ? 's' : ''}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
