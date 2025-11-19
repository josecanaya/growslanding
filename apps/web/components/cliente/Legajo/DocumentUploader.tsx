'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';

interface DocumentUploaderProps {
  categoriaNombre: string;
  onUpload: (file: File, descripcion?: string) => Promise<void>;
  onClose: () => void;
  isUploading?: boolean;
}

export default function DocumentUploader({
  categoriaNombre,
  onUpload,
  onClose,
  isUploading = false,
}: DocumentUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      alert('Por favor seleccioná un archivo');
      return;
    }

    try {
      await onUpload(selectedFile, descripcion || undefined);
      // Reset form
      setSelectedFile(null);
      setDescripcion('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onClose();
    } catch (error) {
      console.error('Error al subir archivo:', error);
      alert('Error al subir el archivo. Por favor intentá nuevamente.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const result = Math.round(bytes / Math.pow(k, i) * 100) / 100;
    return result + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="max-w-md w-full mx-4 shadow-xl bg-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Subir documento</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition"
              aria-label="Cerrar modal"
              disabled={isUploading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Categoría
              </Label>
              <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-sm font-semibold text-slate-700">{categoriaNombre}</span>
              </div>
            </div>

            <div>
              <Label htmlFor="file-input" className="text-sm font-medium text-gray-700 mb-2 block">
                Seleccionar archivo
              </Label>
              <div className="mt-1">
                <Input
                  ref={fileInputRef}
                  id="file-input"
                  type="file"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="cursor-pointer"
                />
              </div>
              {selectedFile && (
                <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="descripcion" className="text-sm font-medium text-gray-700 mb-2 block">
                Descripción (opcional)
              </Label>
              <textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Agregá una descripción del documento..."
                disabled={isUploading}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedFile || isUploading}
              className="bg-sky-600 hover:bg-sky-700 text-white"
            >
              {isUploading ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir documento
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

