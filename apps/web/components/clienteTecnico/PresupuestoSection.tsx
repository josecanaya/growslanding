'use client';

export function PresupuestoSection() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-claro px-6 py-4 border-b border-claro">
          <h2 className="text-xl font-semibold text-primario">Presupuesto</h2>
          <p className="text-sm text-primario/70">Control de costos y presupuestos</p>
        </div>
        <div className="p-8">
          <div className="bg-claro rounded-lg p-8 text-center">
            <p className="text-primario/70 text-lg">Contenido de ejemplo para Presupuesto...</p>
            <p className="text-primario/50 text-sm mt-2">Esta sección estará disponible próximamente</p>
          </div>
        </div>
      </div>
    </div>
  );
}
