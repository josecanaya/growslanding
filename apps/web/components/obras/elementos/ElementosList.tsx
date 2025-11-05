'use client';

import ElementoItem from './ElementoItem';

type ElementosListProps = {
  tipos: Array<{ nombre: string; fases: { estructura: any[]; obra_gris: any[]; terminaciones: any[] } }>;
  onConfig?: (nombre: string) => void;
};

export default function ElementosList({ tipos, onConfig }: ElementosListProps) {
  if (!tipos || tipos.length === 0) {
    return <div className="text-sm text-gray-500">Sin elementos definidos en esta categoría.</div>;
  }

  return (
    <div className="space-y-3">
      {tipos.map((t) => (
        <ElementoItem key={t.nombre} nombre={t.nombre} fases={t.fases} onConfig={() => onConfig?.(t.nombre)} />
      ))}
    </div>
  );
}


