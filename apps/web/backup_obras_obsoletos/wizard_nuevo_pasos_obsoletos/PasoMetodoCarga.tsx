import { Building2, Layers } from 'lucide-react';
import { MetodoCarga, MetodoCargaTipo } from './useWizardStore';

type PasoMetodoCargaProps = {
  metodoCarga: MetodoCarga;
  onSelectMetodo: (tipo: MetodoCargaTipo) => void;
};

const manualFeatures = [
  'Fundación y Estructura',
  'Muros y Cerramientos',
  'Instalaciones Eléctricas',
  'Cubiertas y Techos',
  'Suelos y Pisos',
  'Amenities y Servicios',
  'Parquizado y Exteriores',
];

const bimFeatures = [
  'Importación de archivos .ifc',
  'Mapeo automático inteligente',
  'Vista previa 3D interactiva',
  'Edición manual de mapeos',
  'Validación con base de datos',
  'Exportación optimizada',
  'Colaboración en tiempo real',
];

export function PasoMetodoCarga({ metodoCarga, onSelectMetodo }: PasoMetodoCargaProps) {
  const isManual = metodoCarga.tipo === 'manual';

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-12 text-center">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
          <Building2 className="h-8 w-8 text-white" />
        </div>
        <h1 className="mb-4 text-4xl font-bold text-gray-900">
          Método de Carga de Elementos
        </h1>
        <p className="mx-auto max-w-2xl text-xl leading-relaxed text-gray-600">
          Selecciona la forma en que deseas configurar los elementos constructivos de tu proyecto
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div
          className={`group relative cursor-pointer rounded-3xl border-2 p-8 transition-all duration-300 transform hover:scale-[1.02] ${
            isManual
              ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-xl ring-4 ring-blue-100'
              : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg'
          }`}
          onClick={() => onSelectMetodo('manual')}
        >
          {isManual && (
            <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
              <div className="h-2 w-2 rounded-full bg-white" />
            </div>
          )}

          <div className="text-center">
            <div
              className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-300 ${
                isManual ? 'bg-blue-500 shadow-lg' : 'bg-gray-100 group-hover:bg-blue-100'
              }`}
            >
              <Building2
                className={`h-10 w-10 transition-colors duration-300 ${
                  isManual ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'
                }`}
              />
            </div>

            <h3 className="mb-4 text-2xl font-bold text-gray-900">Carga Manual</h3>
            <p className="mb-6 leading-relaxed text-gray-600">
              Configura elementos constructivos seleccionando desde nuestra base de datos organizada por categorías
            </p>

            <div className="space-y-3 text-left">
              {manualFeatures.map((feature) => (
                <div key={feature} className="flex items-center space-x-3">
                  <div className={`h-2 w-2 rounded-full ${isManual ? 'bg-blue-500' : 'bg-gray-400'}`} />
                  <span className={`text-sm ${isManual ? 'text-gray-700' : 'text-gray-500'}`}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className={`group relative cursor-pointer rounded-3xl border-2 p-8 transition-all duration-300 transform hover:scale-[1.02] ${
            metodoCarga.tipo === 'bim'
              ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-xl ring-4 ring-emerald-100'
              : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-lg'
          }`}
          onClick={() => onSelectMetodo('bim')}
        >
          {metodoCarga.tipo === 'bim' && (
            <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
              <div className="h-2 w-2 rounded-full bg-white" />
            </div>
          )}

          <div className="text-center">
            <div
              className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-300 ${
                metodoCarga.tipo === 'bim'
                  ? 'bg-emerald-500 shadow-lg'
                  : 'bg-gray-100 group-hover:bg-emerald-100'
              }`}
            >
              <Layers
                className={`h-10 w-10 transition-colors duration-300 ${
                  metodoCarga.tipo === 'bim'
                    ? 'text-white'
                    : 'text-gray-600 group-hover:text-emerald-600'
                }`}
              />
            </div>

            <h3 className="mb-4 text-2xl font-bold text-gray-900">Importación BIM</h3>
            <p className="mb-6 leading-relaxed text-gray-600">
              Importa modelos IFC y aprovecha el mapeo automático inteligente de elementos constructivos
            </p>

            <div className="space-y-3 text-left">
              {bimFeatures.map((feature) => (
                <div key={feature} className="flex items-center space-x-3">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      metodoCarga.tipo === 'bim' ? 'bg-emerald-500' : 'bg-gray-400'
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      metodoCarga.tipo === 'bim' ? 'text-gray-700' : 'text-gray-500'
                    }`}
                  >
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="mb-2 text-lg font-semibold text-gray-900">Recomendación</h4>
            <p className="leading-relaxed text-gray-700">
              {isManual
                ? 'La carga manual es ideal para proyectos nuevos o cuando necesitas control total sobre cada elemento.'
                : 'La importación BIM es perfecta cuando ya tienes un modelo 3D desarrollado y quieres acelerar el proceso.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
