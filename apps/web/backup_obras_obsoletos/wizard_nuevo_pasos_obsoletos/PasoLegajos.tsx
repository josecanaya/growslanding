'use client';

import { useRef } from 'react';
import { useWizardStore } from './useWizardStore';

type PasoLegajosProps = {
  onPrev: () => void;
  onNext: () => void;
};

function bytesToSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function PasoLegajos({ onPrev, onNext }: PasoLegajosProps) {
  // Selecciones individuales para evitar objetos nuevos por render
  const legajos = useWizardStore((s) => s.legajos);
  const addPlantaBlock = useWizardStore((s) => s.addPlantaBlock);
  const removePlantaBlock = useWizardStore((s) => s.removePlantaBlock);
  const addArchivosToPlanta = useWizardStore((s) => s.addArchivosToPlanta);
  const removeArchivoFromPlanta = useWizardStore((s) => s.removeArchivoFromPlanta);

  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  function triggerFile(planta: number) {
    inputRefs.current[planta]?.click();
  }

  function onFilesSelected(planta: number, files: FileList | null) {
    if (!files || files.length === 0) return;
    addArchivosToPlanta(planta, Array.from(files));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
        <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-5 py-4">
          <h2 className="text-lg font-semibold" style={{ color: '#003C6E' }}>Carga de legajos y planos</h2>
          <button
            type="button"
            onClick={addPlantaBlock}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold hover:bg-gray-50"
          >
            + Agregar planta
          </button>
        </div>

        <div className="space-y-4 p-5">
          {legajos.map((bloque) => (
            <div key={bloque.planta} className="rounded-lg border border-gray-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Planta {bloque.planta}</h3>
                {legajos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePlantaBlock(bloque.planta)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Eliminar planta
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-gray-600">
                  Formatos permitidos: .pdf, .dwg, .jpg, .png (simulado)
                </div>
                <div>
                  <input
                    ref={(el) => (inputRefs.current[bloque.planta] = el)}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => onFilesSelected(bloque.planta, e.target.files)}
                  />
                  <button
                    type="button"
                    onClick={() => triggerFile(bloque.planta)}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                    style={{ backgroundColor: '#0055A4' }}
                  >
                    Subir archivos
                  </button>
                </div>
              </div>

              {bloque.archivos.length > 0 && (
                <div className="mt-4 grid gap-2">
                  {bloque.archivos.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      className="flex items-center justify-between rounded border border-gray-200 px-3 py-2 text-sm"
                    >
                      <div className="truncate">
                        <span className="font-medium">{file.name}</span>{' '}
                        <span className="text-gray-600">({bytesToSize(file.size)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeArchivoFromPlanta(bloque.planta, idx)}
                        className="text-red-600 hover:underline"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100" />
        <div className="flex items-center justify-center gap-3 p-5">
          <button
            type="button"
            onClick={onPrev}
            className="rounded-lg border border-gray-300 px-6 py-2.5 font-semibold text-gray-800 hover:bg-gray-50"
          >
            Atrás
          </button>
          <button
            type="button"
            onClick={onNext}
            className="rounded-lg px-6 py-2.5 font-semibold text-white"
            style={{ backgroundColor: '#0055A4' }}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}


