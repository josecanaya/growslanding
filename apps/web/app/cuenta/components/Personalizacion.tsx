'use client';

export default function Personalizacion(): JSX.Element {
  return (
    <section className="rounded-2xl border border-white/60 bg-white/80 shadow-md backdrop-blur px-6 py-6">
      <header className="mb-4 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-500">🎨</span>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Preferencias de la aplicación</h2>
          <p className="text-sm text-gray-500">Personalizá el aspecto visual y la experiencia general de la plataforma.</p>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-gray-100 bg-white/90 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Tema</h3>
          <p className="text-sm text-gray-500">Elegí entre modo claro u oscuro según tus preferencias.</p>
          <div className="flex gap-3">
            <button className="rounded-xl border border-blue-500 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600">
              Tema claro
            </button>
            <button className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600">
              Tema oscuro
            </button>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-gray-100 bg-white/90 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Idioma</h3>
          <p className="text-sm text-gray-500">Definí el idioma principal de la interfaz.</p>
          <div className="flex gap-3">
            <button className="rounded-xl border border-blue-500 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600">
              Español
            </button>
            <button className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600">
              Inglés
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-2xl border border-gray-100 bg-white/90 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Color principal</h3>
          <div className="flex flex-wrap gap-2">
            {['Azul', 'Verde', 'Gris', 'Naranja'].map((color) => (
              <span
                key={color}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600"
              >
                {color}
              </span>
            ))}
          </div>
        </div>
        <div className="space-y-2 rounded-2xl border border-gray-100 bg-white/90 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>Notificaciones en la app — Activadas</li>
            <li>Alertas por email — Pendiente</li>
            <li>Tareas validadas — Activadas</li>
            <li>Nuevas obras asignadas — Activadas</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
          Guardar preferencias
        </button>
        <button className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm transition hover:border-gray-300 hover:text-gray-800">
          Restablecer valores
        </button>
      </div>
    </section>
  );
}
