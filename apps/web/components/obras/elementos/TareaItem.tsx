'use client';

type TareaItemProps = {
  nombre: string;
  onClick?: () => void;
};

export default function TareaItem({ nombre, onClick }: TareaItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border border-gray-200 px-4 py-3 text-left hover:bg-gray-50 transition"
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-800">{nombre}</span>
        <span className="text-xs text-gray-500">Editar</span>
      </div>
    </button>
  );
}


