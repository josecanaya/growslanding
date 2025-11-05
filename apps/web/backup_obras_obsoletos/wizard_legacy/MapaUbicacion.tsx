'use client';

import { useState } from 'react';
import { MapPin, Map } from 'lucide-react';

interface MapaUbicacionProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
}

export function MapaUbicacion({ 
  isOpen, 
  onClose, 
  onLocationSelect, 
  initialLat, 
  initialLng 
}: MapaUbicacionProps) {
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );

  const handleGeocode = async () => {
    if (!address.trim()) return;
    
    // Placeholder para geocodificaciÃ³n
    // En una implementaciÃ³n real, usarÃ­as Google Maps Geocoding API
    try {
      // Simular geocodificaciÃ³n
      const mockLat = -34.6037 + (Math.random() - 0.5) * 0.1;
      const mockLng = -58.3816 + (Math.random() - 0.5) * 0.1;
      
      setCoordinates({ lat: mockLat, lng: mockLng });
    } catch (error) {
      console.error('Error en geocodificaciÃ³n:', error);
    }
  };

  const handleConfirm = () => {
    if (coordinates) {
      onLocationSelect(coordinates.lat, coordinates.lng, address);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Map className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Seleccionar UbicaciÃ³n</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            âœ•
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4">
          {/* Buscador de direcciÃ³n */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar direcciÃ³n
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Av. Corrientes 1234, CABA, Argentina"
              />
              <button
                onClick={handleGeocode}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Buscar
              </button>
            </div>
          </div>

          {/* Mapa placeholder */}
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center relative">
            {coordinates ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-blue-600 text-white p-3 rounded-full shadow-lg">
                  <MapPin className="h-6 w-6" />
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Map className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Google Maps se integrara aqui</p>
                <p className="text-sm text-gray-500 mt-2">
                  Por ahora, puedes escribir la direccion y hacer clic en &quot;Buscar&quot;
                </p>
              </div>
            )}
          </div>

          {/* Coordenadas */}
          {coordinates && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <MapPin className="h-4 w-4 inline mr-1" />
                UbicaciÃ³n seleccionada: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!coordinates}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              Confirmar UbicaciÃ³n
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

