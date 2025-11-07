'use client';

import { MapPin, Check, X } from 'lucide-react';

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
}

export default function MapPickerModal({
  isOpen,
  onClose,
  onLocationSelect,
  initialLat = -34.6037,
  initialLng = -58.3816,
}: MapPickerModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onLocationSelect(initialLat, initialLng, 'Ubicación seleccionada manualmente');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2 text-blue-600">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Seleccionar ubicación</h2>
              <p className="text-sm text-gray-500">
                Próximamente se integrará un selector de mapa. Por ahora podés usar la ubicación sugerida o
                cancelar para ingresar otra dirección manualmente.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200"
          >
            <X className="h-4 w-4" />
            Cerrar
          </button>
        </div>

        <div className="space-y-6 px-6 py-8">
          <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-6 text-center text-sm text-blue-900">
            <p className="mb-2 font-medium">Selector de mapa aún no disponible</p>
            <p>
              Estamos trabajando para integrar la selección visual de ubicaciones. Mientras tanto podés confirmar la
              ubicación sugerida o ingresar coordenadas manualmente desde los campos del formulario.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-700">
            <span className="font-semibold text-gray-900">Sugerencia actual</span>
            <span>
              Latitud: <strong>{initialLat.toFixed(5)}</strong> – Longitud: <strong>{initialLng.toFixed(5)}</strong>
            </span>
            <span className="text-xs text-gray-500">
              Podés modificar estos valores más adelante desde el formulario o cargando coordenadas precisas.
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t bg-gray-50 px-6 py-4">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Check className="h-4 w-4" />
            Usar esta ubicación
          </button>
        </div>
      </div>
    </div>
  );
}
