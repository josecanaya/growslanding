'use client';

export default function Suscripcion(): JSX.Element {
  return (
    <section className="rounded-2xl border border-white/60 bg-white/80 shadow-md backdrop-blur px-6 py-6">
      <header className="mb-4 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-500">💳</span>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Suscripción actual</h2>
          <p className="text-sm text-gray-500">Visualizá el plan contratado y administrá la facturación.</p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white/90 p-4 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Plan activo</span>
          <p className="mt-2 text-sm font-semibold text-gray-900">Plan Profesional</p>
          <p className="text-xs text-gray-500">Obras ilimitadas · Panel colaborativo</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white/90 p-4 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Próxima renovación</span>
          <p className="mt-2 text-sm font-semibold text-gray-900">05 de octubre 2025</p>
          <p className="text-xs text-gray-500">Renovación automática habilitada</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white/90 p-4 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Método de pago</span>
          <p className="mt-2 text-sm font-semibold text-gray-900">Visa terminada en 8291</p>
          <p className="text-xs text-gray-500">Última actualización 15/08/2025</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white/90 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Beneficios principales</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>• Seguimiento avanzado de obras</li>
            <li>• Reportes en tiempo real</li>
            <li>• Soporte prioritario para tu equipo</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white/90 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Facturación reciente</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>05/09/2025 · $18.500 · Pagado</li>
            <li>05/08/2025 · $18.500 · Pagado</li>
            <li>05/07/2025 · $18.500 · Pagado</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
          Cambiar plan
        </button>
        <button className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm transition hover:border-gray-300 hover:text-gray-800">
          Descargar facturas
        </button>
      </div>
    </section>
  );
}
