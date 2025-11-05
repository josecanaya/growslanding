import { ChangeEvent } from 'react';
import { Calendar, MapPin, User, Building2, Layers } from 'lucide-react';
import { DatosGenerales } from './useWizardStore';

type PasoDatosGeneralesProps = {
  datosGenerales: DatosGenerales;
  onChange: (payload: Partial<DatosGenerales>) => void;
};

export function PasoDatosGenerales({ datosGenerales, onChange }: PasoDatosGeneralesProps) {
  // TODO: conectar con fuentes reales de datos (Supabase) cuando se implemente backend.
  const handleInputChange =
    (field: keyof DatosGenerales) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      onChange({ [field]: event.target.value } as Partial<DatosGenerales>);
    };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-12 text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
          <User className="h-8 w-8 text-white" />
        </div>
        <h1 className="mb-4 text-4xl font-bold text-gray-900">Datos generales del proyecto</h1>
        <p className="mx-auto max-w-2xl text-xl leading-relaxed text-gray-600">
          Completa la información fundamental de la obra. Esta sección se integrará con tus datos de clientes y propiedades.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-lg">
          <h2 className="mb-6 flex items-center space-x-3 text-xl font-semibold text-gray-900">
            <User className="h-5 w-5 text-indigo-500" />
            <span>Cliente</span>
          </h2>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-600">Nombre del cliente</span>
              <input
                type="text"
                value={datosGenerales.cliente}
                onChange={handleInputChange('cliente')}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="Ej: Familia Rodríguez"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-600">Dirección de la obra</span>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={datosGenerales.direccion}
                  onChange={handleInputChange('direccion')}
                  className="w-full rounded-xl border border-gray-200 px-11 py-3 text-gray-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="Ej: Av. Libertador 1234, CABA"
                />
              </div>
            </label>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-lg">
          <h2 className="mb-6 flex items-center space-x-3 text-xl font-semibold text-gray-900">
            <Building2 className="h-5 w-5 text-indigo-500" />
            <span>Información del proyecto</span>
          </h2>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-600">Fecha de inicio</span>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={datosGenerales.fecha_inicio}
                  onChange={handleInputChange('fecha_inicio')}
                  className="w-full rounded-xl border border-gray-200 px-11 py-3 text-gray-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-600">Tipo de proyecto</span>
              <div className="relative">
                <Layers className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <select
                  value={datosGenerales.tipo_proyecto}
                  onChange={handleInputChange('tipo_proyecto')}
                  className="w-full appearance-none rounded-xl border border-gray-200 px-11 py-3 text-gray-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="unifamiliar">Unifamiliar</option>
                  <option value="multifamiliar">Multifamiliar</option>
                  <option value="ampliacion">Ampliación</option>
                  <option value="refaccion">Refacción</option>
                </select>
              </div>
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-600">Número de plantas</span>
                <input
                  type="number"
                  min={1}
                  value={datosGenerales.numero_plantas}
                  onChange={handleInputChange('numero_plantas')}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-600">
                  Superficie estimada por planta (mÂ²)
                </span>
                <input
                  type="number"
                  min={0}
                  value={datosGenerales.superficie_estimada_por_planta ?? ''}
                  onChange={handleInputChange('superficie_estimada_por_planta')}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="Opcional"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
