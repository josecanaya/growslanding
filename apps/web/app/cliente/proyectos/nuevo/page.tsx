'use client';

import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { SectionHeader } from '@/components/cliente/SectionHeader';
import { Button } from '@/components/ui/grows';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

export default function NuevoProyectoDesdeIdeaPage() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const [nombre, setNombre] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crear = async () => {
    if (!currentUser?.orgId) {
      setError('No hay organización activa.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/obras/desde-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: currentUser.orgId,
          nombre: nombre.trim() || undefined,
          objetivo_texto: objetivo.trim() || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message ?? json.details ?? 'No se pudo crear el proyecto');
      }
      const href = (json.redirectTo ?? `/cliente/proyectos/${json.obra?.id}/grafo`) as Route;
      router.push(href);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <SectionHeader
        eyebrow="Proyecto vivo"
        title="Empezar desde una idea"
        description="Sin wizard de m². Un nodo IDEA y crecimiento por transformaciones."
      />
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="block text-sm font-medium text-slate-700">
            Nombre del proyecto
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Mi edificio, reforma, producto…"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Objetivo (el orquestador L0 propone transformaciones a partir de esto)
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              rows={3}
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
              placeholder="Qué quiero lograr…"
            />
          </label>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <Button
            variant="primary"
            icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            onClick={() => void crear()}
            disabled={loading || !currentUser?.orgId}
          >
            Crear proyecto
          </Button>
      </div>
    </div>
  );
}
