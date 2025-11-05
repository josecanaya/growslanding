'use client';

import ConfiguracionItem from './ConfiguracionItem';
import TareaItem from './TareaItem';

type GrupoElementosCardProps = {
  nombre: string;
  configuraciones: string[];
  tareas: string[];
  onConfigClick?: (nombre: string) => void;
  onTareaClick?: (nombre: string) => void;
};

export default function GrupoElementosCard({ nombre, configuraciones, tareas, onConfigClick, onTareaClick }: GrupoElementosCardProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4" style={{ color: '#003C6E' }}>{nombre}</h2>
        <div className="space-y-3">
          {configuraciones.length === 0 && (
            <div className="text-sm text-gray-500">Sin elementos definidos en esta categoría.</div>
          )}
          {configuraciones.map((c) => (
            <ConfiguracionItem key={c} nombre={c} onClick={() => onConfigClick?.(c)} />
          ))}
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4" style={{ color: '#003C6E' }}>Tareas</h2>
        <div className="space-y-3">
          {tareas.length === 0 && (
            <div className="text-sm text-gray-500">Sin tareas asociadas.</div>
          )}
          {tareas.map((t) => (
            <TareaItem key={t} nombre={t} onClick={() => onTareaClick?.(t)} />
          ))}
        </div>
      </div>
    </div>
  );
}


