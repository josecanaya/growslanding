'use client';

interface ModalSeleccionCantidadProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function ModalSeleccionCantidad({ isOpen = false, onClose }: ModalSeleccionCantidadProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900">ModalSeleccionCantidad</h2>
        <p className="mt-2 text-sm text-gray-600">
          Placeholder del modal. Agregá la UI definitiva cuando esté disponible.
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
