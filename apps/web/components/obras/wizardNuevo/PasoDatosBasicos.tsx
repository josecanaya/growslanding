'use client';

import { useMemo, useState } from 'react';
import { useWizardStore, TipoObra } from './useWizardStore';
import PasoCargaElementos from './PasoCargaElementos';
import MapPickerModal from './components/MapPickerModal';
import { useGeocoding } from './hooks/useGeocoding';

const TIPO_OBRA_OPCIONES: { key: TipoObra; label: string }[] = [
  { key: 'Casa familiar', label: 'Casa familiar' },
  { key: 'Ampliación', label: 'Ampliación' },
  { key: 'Reforma', label: 'Reforma' },
  { key: 'Local comercial', label: 'Local comercial' },
  { key: 'Edificio pequeño', label: 'Edificio pequeño' },
  { key: 'Otro', label: 'Otro' },
];

interface PasoDatosBasicosProps {
  onNext: () => void;
}

export default function PasoDatosBasicos({ onNext }: PasoDatosBasicosProps) {
  const id = useWizardStore((s) => s.id);
  const propietario = useWizardStore((s) => s.propietario);
  const tipoObra = useWizardStore((s) => s.tipoObra);
  const direccion = useWizardStore((s) => s.direccion);
  const latitud = useWizardStore((s) => s.latitud);
  const longitud = useWizardStore((s) => s.longitud);
  const setField = useWizardStore((s) => s.setField);
  const ensureId = useWizardStore((s) => s.ensureId);
  const setTipoObra = useWizardStore((s) => s.setTipoObra);

  const { searchAddresses, geocodeAddress, isLoading: geocodingLoading } = useGeocoding();

  // Inicializa id del proyecto solo una vez
  useMemo(() => {
    ensureId();
  }, [ensureId]);

  const [searchQuery, setSearchQuery] = useState(direccion ?? '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const puedeContinuar = useMemo(() => {
    const dir = (direccion ?? '').trim();
    const prop = (propietario ?? '').trim();
    return dir.length > 3 && prop.length > 2 && !!tipoObra;
  }, [direccion, propietario, tipoObra]);

  const handleSearchChange = async (value: string) => {
    setSearchQuery(value);
    setField('direccion', value);

    if (value.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    const results = await searchAddresses(value);
    setSuggestions(results);
    setShowSuggestions(results.length > 0);
    setIsSearching(false);
  };

  const handleAddressSelect = async (selectedAddress: string) => {
    setSearchQuery(selectedAddress);
    setShowSuggestions(false);

    const result = await geocodeAddress(selectedAddress);
    if (result) {
      setField('direccion', result.address);
      setField('latitud', result.lat);
      setField('longitud', result.lng);
    }
  };

  const handleMapLocationSelect = (lat: number, lng: number, address: string) => {
    setField('latitud', lat);
    setField('longitud', lng);
    setField('direccion', address);
    setSearchQuery(address);
    setIsMapModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
        <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: '#003C6E' }}>
              Datos básicos
            </h2>
            <p className="text-sm text-gray-600">Completá la información inicial del proyecto</p>
          </div>
          {id && (
            <div className="rounded-md px-3 py-1 text-sm font-semibold" style={{ backgroundColor: '#E6EEF7', color: '#003C6E' }}>
              ID: #{id}
            </div>
          )}
        </div>

        <div className="grid gap-6 p-5 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-800">Dirección</label>
            <div className="relative">
              <input
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                placeholder="Calle, número, ciudad"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                  <ul className="max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        onClick={() => handleAddressSelect(suggestion)}
                        className="cursor-pointer px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                      >
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {(geocodingLoading || isSearching) && (
              <p className="text-sm text-gray-500">Buscando dirección...</p>
            )}
            <button
              type="button"
              onClick={() => setIsMapModalOpen(true)}
              className="mt-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Seleccionar en mapa
            </button>
            {latitud !== undefined && longitud !== undefined && (
              <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                <span className="font-medium">Coordenadas:</span> {latitud.toFixed(6)}, {longitud.toFixed(6)}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-800">Nombre del dueño</label>
            <input
              value={propietario ?? ''}
              onChange={(e) => setField('propietario', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              placeholder="Nombre y apellido"
            />
          </div>

          <div className="space-y-3 md:col-span-2">
            <label className="text-sm font-medium text-gray-800">Tipo de obra</label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {TIPO_OBRA_OPCIONES.map((opt) => {
                const active = tipoObra === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setTipoObra(opt.key)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                      active ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium text-gray-900">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {tipoObra === 'Otro' && (
              <input
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                placeholder="Especificá el tipo de obra"
                onChange={(e) => setField('tipoObra', (e.target.value || 'Otro') as TipoObra)}
              />
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            disabled={!puedeContinuar}
            onClick={onNext}
            className={`rounded-lg px-6 py-2.5 font-semibold text-white transition $ {puedeContinuar ? '' : 'opacity-60'}`.replace(' $', ' ')}
            style={{ backgroundColor: '#0055A4' }}
          >
            Siguiente
          </button>
        </div>
      </div>

      <MapPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onLocationSelect={handleMapLocationSelect}
        initialLat={latitud}
        initialLng={longitud}
      />
    </div>
  );
}
