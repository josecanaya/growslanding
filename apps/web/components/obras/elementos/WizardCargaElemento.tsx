'use client';

import { useMemo, useState } from 'react';
import { useElementosStore, type Elemento } from './useElementosStore';

type Paso = 1 | 2 | 3;

type WizardCargaElementoProps = {
  plantaSeleccionada?: string; // e.g., 'PB', '1', etc.
  onCompleted?: (elemento: Elemento) => void;
};

export default function WizardCargaElemento({ plantaSeleccionada, onCompleted }: WizardCargaElementoProps) {
  const addElemento = useElementosStore((s) => s.addElemento);
  const [step, setStep] = useState<Paso>(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<Elemento>({
    id: '',
    nombre: '',
    tipo: '',
    categoria: '',
    unidad: 'unidad',
    cantidad: 1,
    costoUnitario: 0,
    plantaId: plantaSeleccionada ?? '',
  });

  const puedePaso1 = useMemo(() => (form.nombre?.trim().length || 0) > 2 && (form.tipo?.trim().length || 0) > 0, [form.nombre, form.tipo]);
  const puedePaso2 = useMemo(() => true, []);

  const goNext = () => setStep((s) => Math.min(3, (s + 1) as Paso));
  const goPrev = () => setStep((s) => Math.max(1, (s - 1) as Paso));

  const handleSave = async () => {
    setSaving(true);
    addElemento({ ...form, id: '' });
    setTimeout(() => {
      setSaving(false);
      onCompleted?.(form);
    }, 500);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-lg font-semibold" style={{ color: '#003C6E' }}>Agregar elemento</h3>
        <p className="text-sm text-gray-600">Completá los datos del elemento en pocos pasos</p>
      </div>

      <div className="px-5 py-4">
        {step === 1 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-800">Nombre</label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                placeholder="Ej: Muro ladrillo hueco 18cm"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-800">Tipo</label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                placeholder="Ej: material, tarea, equipo"
                value={form.tipo}
                onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-800">Categoría (opcional)</label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                placeholder="Ej: mampostería"
                value={form.categoria}
                onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-800">Unidad</label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                placeholder="Ej: m2, m3, unidad"
                value={form.unidad}
                onChange={(e) => setForm((f) => ({ ...f, unidad: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-800">Cantidad</label>
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                value={form.cantidad ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, cantidad: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-800">Costo unitario</label>
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                value={form.costoUnitario ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, costoUnitario: Number(e.target.value) }))}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-800">Planta</label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                placeholder="Ej: PB, 1, 2"
                value={form.plantaId}
                onChange={(e) => setForm((f) => ({ ...f, plantaId: e.target.value }))}
              />
              <p className="mt-1 text-xs text-gray-600">Asociá el elemento a una planta específica.</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="rounded-lg border border-gray-200 p-4">
              <h4 className="mb-3 font-semibold" style={{ color: '#003C6E' }}>Confirmación</h4>
              <ul className="grid gap-1 text-sm text-gray-700">
                <li><span className="text-gray-600">Nombre:</span> {form.nombre}</li>
                <li><span className="text-gray-600">Tipo:</span> {form.tipo}</li>
                <li><span className="text-gray-600">Categoría:</span> {form.categoria || '-'}</li>
                <li><span className="text-gray-600">Unidad:</span> {form.unidad || '-'}</li>
                <li><span className="text-gray-600">Cantidad:</span> {form.cantidad ?? 0}</li>
                <li><span className="text-gray-600">Costo unitario:</span> {form.costoUnitario ?? 0}</li>
                <li><span className="text-gray-600">Planta:</span> {form.plantaId || 'General'}</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4">
        <button
          type="button"
          disabled={step === 1 || saving}
          onClick={goPrev}
          className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
        >
          Atrás
        </button>
        {step < 3 ? (
          <button
            type="button"
            disabled={(!puedePaso1 && step === 1) || (!puedePaso2 && step === 2) || saving}
            onClick={goNext}
            className="rounded-lg px-6 py-2.5 font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: '#0055A4' }}
          >
            Siguiente
          </button>
        ) : (
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="rounded-lg px-6 py-2.5 font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: '#0055A4' }}
          >
            {saving ? 'Guardando...' : 'Agregar elemento'}
          </button>
        )}
      </div>
    </div>
  );
}


