'use client';

type ElementoItemProps = {
  nombre: string;
  fases: { estructura: any[]; obra_gris: any[]; terminaciones: any[] };
  onConfig?: () => void;
};

export default function ElementoItem({ nombre, fases, onConfig }: ElementoItemProps) {
  const badges: string[] = [];
  if (fases?.estructura?.length) badges.push('Estructura');
  if (fases?.obra_gris?.length) badges.push('Obra gris');
  if (fases?.terminaciones?.length) badges.push('Terminaciones');

  return (
    <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition">
      <div>
        <h3 className="font-medium text-gray-800">{nombre}</h3>
        <div className="mt-1 flex flex-wrap gap-2">
          {badges.map((b) => (
            <span key={b} className="bg-blue-50 text-blue-700 rounded-md px-2 py-0.5 text-xs border border-blue-100">
              {b}
            </span>
          ))}
          {badges.length === 0 && (
            <span className="text-xs text-gray-500">Sin fases asociadas</span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onConfig}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
      >
        Configurar
      </button>
    </div>
  );
}


