'use client';

import { ObraData } from '../WizardCrearObra';

interface PasoDatosBasicosProps {
  data: ObraData;
  onChange: (data: ObraData) => void;
}

export function PasoDatosBasicos({ data, onChange }: PasoDatosBasicosProps) {
  const handleChange = (field: keyof ObraData, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-primario mb-2">Datos Básicos de la Obra</h3>
          <p className="text-primario/70">
            Completa la información básica para crear tu nueva obra
          </p>
        </div>

        <div className="space-y-6">
          {/* Nombre de la obra */}
          <div>
            <label className="block text-sm font-medium text-primario mb-2">
              Nombre de la obra *
            </label>
            <input
              type="text"
              value={data.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Ej: Casa Familiar - Villa Crespo"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primario focus:border-transparent text-primario placeholder-gray-400"
            />
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-primario mb-2">
              Cliente *
            </label>
            <input
              type="text"
              value={data.cliente}
              onChange={(e) => handleChange('cliente', e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primario focus:border-transparent text-primario placeholder-gray-400"
            />
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-sm font-medium text-primario mb-2">
              Ubicación *
            </label>
            <input
              type="text"
              value={data.localizacion}
              onChange={(e) => handleChange('localizacion', e.target.value)}
              placeholder="Ej: Villa Crespo, CABA"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primario focus:border-transparent text-primario placeholder-gray-400"
            />
          </div>

          {/* Tipo de obra */}
          <div>
            <label className="block text-sm font-medium text-primario mb-2">
              Tipo de obra *
            </label>
            <select
              value={data.tipoObra}
              onChange={(e) => handleChange('tipoObra', e.target.value as 'nueva' | 'reforma' | 'ampliacion')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primario focus:border-transparent text-primario"
            >
              <option value="nueva">Nueva construcción</option>
              <option value="reforma">Reforma</option>
              <option value="ampliacion">Ampliación</option>
            </select>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-primario mb-2">
                Fecha de inicio *
              </label>
              <input
                type="date"
                value={data.fechaInicio}
                onChange={(e) => handleChange('fechaInicio', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primario focus:border-transparent text-primario"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primario mb-2">
                Fecha de finalización estimada
              </label>
              <input
                type="date"
                value={data.fechaFin}
                onChange={(e) => handleChange('fechaFin', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primario focus:border-transparent text-primario"
              />
            </div>
          </div>

          {/* Número de permiso (solo para obras nuevas) */}
          {data.tipoObra === 'nueva' && (
            <div>
              <label className="block text-sm font-medium text-primario mb-2">
                Número de permiso de obra (opcional)
              </label>
              <input
                type="text"
                value={data.numeroPermiso || ''}
                onChange={(e) => handleChange('numeroPermiso', e.target.value)}
                placeholder="Ej: PO-2024-001234"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primario focus:border-transparent text-primario placeholder-gray-400"
              />
            </div>
          )}

          {/* Resumen de validación */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Resumen de validación:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li className={`flex items-center space-x-2 ${data.nombre ? 'text-green-600' : 'text-red-600'}`}>
                <span>{data.nombre ? '✓' : '✗'}</span>
                <span>Nombre de la obra</span>
              </li>
              <li className={`flex items-center space-x-2 ${data.cliente ? 'text-green-600' : 'text-red-600'}`}>
                <span>{data.cliente ? '✓' : '✗'}</span>
                <span>Cliente</span>
              </li>
              <li className={`flex items-center space-x-2 ${data.localizacion ? 'text-green-600' : 'text-red-600'}`}>
                <span>{data.localizacion ? '✓' : '✗'}</span>
                <span>Ubicación</span>
              </li>
              <li className={`flex items-center space-x-2 ${data.fechaInicio ? 'text-green-600' : 'text-red-600'}`}>
                <span>{data.fechaInicio ? '✓' : '✗'}</span>
                <span>Fecha de inicio</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

