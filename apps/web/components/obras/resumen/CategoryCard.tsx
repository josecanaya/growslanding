'use client';

type CategoryCardProps = {
  nombre: string;
  porcentaje: number;
  estado: 'completado' | 'en_progreso' | 'pendiente';
  elementosActivos?: string[];
  iconColor?: string;
};

export default function CategoryCard({ 
  nombre, 
  porcentaje, 
  estado, 
  elementosActivos = [],
  iconColor = '#003C6E'
}: CategoryCardProps) {
  const estadoConfig = {
    'completado': { color: '#10b981', bg: '#d1fae5', label: 'Completado', icon: '✅' },
    'en_progreso': { color: '#f59e0b', bg: '#fef3c7', label: 'En progreso', icon: '🔄' },
    'pendiente': { color: '#6b7280', bg: '#f3f4f6', label: 'Pendiente', icon: '⏳' }
  }[estado];

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{nombre}</h4>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: estadoConfig.color }}>
              {estadoConfig.icon} {estadoConfig.label}
            </span>
            <span className="text-xs font-bold text-gray-700">{Math.round(porcentaje)}%</span>
          </div>
        </div>
      </div>

      <div className="w-full h-2 rounded-full bg-gray-200 mb-3">
        <div 
          className="h-2 rounded-full transition-all duration-500"
          style={{ 
            width: `${porcentaje}%`,
            backgroundColor: iconColor
          }}
        ></div>
      </div>

      {elementosActivos.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Elementos activos:</p>
          <div className="flex flex-wrap gap-1">
            {elementosActivos.slice(0, 3).map((elem, idx) => (
              <span 
                key={idx}
                className="px-2 py-1 text-xs bg-gray-50 text-gray-700 rounded-md border border-gray-200"
              >
                {elem}
              </span>
            ))}
            {elementosActivos.length > 3 && (
              <span className="px-2 py-1 text-xs text-gray-500">
                +{elementosActivos.length - 3} más
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

