'use client';

import { useState } from 'react';
import { crearObra } from '@/services/obrasService';

export default function NuevaObraPage() {
  const [org_id, setOrg] = useState('');
  const [nombre, setNombre] = useState('');
  const [localizacion, setLocalizacion] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const obra = await crearObra({
        org_id,
        nombre,
        localizacion: localizacion || undefined,
      });

      setMsg(`✅ Obra creada: ${obra.nombre} (${obra.id})`);
      setOrg('');
      setNombre('');
      setLocalizacion('');
    } catch (err: any) {
      setMsg(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Nueva obra</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">org_id (UUID)</label>
          <input
            className="w-full border p-2 rounded"
            placeholder="org_id (uuid)"
            value={org_id}
            onChange={(e) => setOrg(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nombre de la obra</label>
          <input
            className="w-full border p-2 rounded"
            placeholder="Nombre de la obra"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Dirección (opcional)</label>
          <input
            className="w-full border p-2 rounded"
            placeholder="Dirección"
            value={localizacion}
            onChange={(e) => setLocalizacion(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Creando…' : 'Crear obra'}
        </button>
      </form>
      {msg && (
        <p className={`text-sm p-3 rounded ${msg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg}
        </p>
      )}
    </div>
  );
}

