'use client';

interface ModalCrearTareaProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function ModalCrearTarea({ isOpen = false, onClose }: ModalCrearTareaProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900">ModalCrearTarea</h2>
        <p className="mt-2 text-sm text-gray-600">
          Este es un placeholder temporal. Implementá la lógica del modal acá.
        </p>
        <button
          type="button"
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
