'use client';

import { useState, useEffect, useRef } from 'react';

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
}

export default function MapPickerModal({
  isOpen,
  onClose,
  onLocationSelect,
  initialLat,
  initialLng,
  initialAddress,
}: MapPickerModalProps) {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );
  const [address, setAddress] = useState(initialAddress || '');
  const [isLoading, setIsLoading] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (isOpen && mapContainerRef.current) {
      // Placeholder para mapa interactivo
      // En producción, aquí se integraría Leaflet o Google Maps
      if (coordinates) {
        markerRef.current = coordinates;
      }
    }
  }, [isOpen, coordinates]);

  const handleMapClick = async (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Simular coordenadas basadas en click (mock para demo)
    // En producción usarías las coordenadas reales del mapa
    const mockLat = -34.6037 + ((y / rect.height) - 0.5) * 0.1;
    const mockLng = -58.3816 + ((x / rect.width) - 0.5) * 0.1;

    setCoordinates({ lat: mockLat, lng: mockLng });
    setIsLoading(true);

    // Reverse geocoding
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${mockLat}&lon=${mockLng}`,
        {
          headers: {
            'User-Agent': 'GROWS-Construction-App',
          },
        }
      );

      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      }
    } catch (err) {
      console.error('Error en reverse geocoding:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (coordinates) {
      onLocationSelect(coordinates.lat, coordinates.lng, address || '');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold" style={{ color: '#003C6E' }}>
            Seleccionar ubicación en mapa
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Dirección
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            placeholder="Buscar dirección o hacer click en el mapa"
          />
        </div>

        {/* Mapa placeholder */}
        <div
          ref={mapContainerRef}
          onClick={handleMapClick}
          className="relative h-96 w-full cursor-crosshair rounded-lg border border-gray-300 bg-gray-100 overflow-hidden"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'400\' height=\'400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h400v400H0z\' fill=\'%23e5e7eb\'/%3E%3Cpath d=\'M0 200h400M200 0v400\' stroke=\'%23d1d5db\' stroke-width=\'1\'/%3E%3Ccircle cx=\'200\' cy=\'200\' r=\'8\' fill=\'%230055A4\'/%3E%3Ctext x=\'200\' y=\'220\' text-anchor=\'middle\' font-size=\'12\' fill=\'%230055A4\'%3EClick para seleccionar%3C/text%3E%3C/svg%3E")',
            backgroundSize: 'cover',
          }}
        >
          {coordinates && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
              }}
            >
              <div className="h-6 w-6 rounded-full border-4 border-white bg-blue-600 shadow-lg" />
            </div>
          )}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
              <div className="rounded-lg bg-white px-4 py-2 text-sm">Cargando dirección...</div>
            </div>
          )}
        </div>

        {/* Coordenadas */}
        {coordinates && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
            <p className="text-sm text-green-800">
              <span className="font-medium">Coordenadas:</span> {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
            </p>
            {address && (
              <p className="mt-1 text-xs text-green-700">{address}</p>
            )}
          </div>
        )}

        {/* Botones */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!coordinates}
            className={`rounded-lg px-6 py-2 font-semibold text-white transition ${
              coordinates ? '' : 'cursor-not-allowed opacity-60'
            }`}
            style={{ backgroundColor: coordinates ? '#0055A4' : '#9ca3af' }}
          >
            Confirmar ubicación
          </button>
        </div>
      </div>
    </div>
  );
}

