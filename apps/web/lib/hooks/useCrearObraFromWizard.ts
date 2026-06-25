'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useWizardStore } from '@/components/obras/wizardNuevo/useWizardStore';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { crearObra } from '@/services/obrasService';
import {
  OBRA_PRODUCT_KIND_LABEL,
  obraProductKindToLegacyTipoObra,
  isLightObraProductKind,
  seedSessionObraProductKind,
  type ObraProductKind,
} from '@/lib/canvas/obraProductKind';
import { seedSessionCanvasProjectKind } from '@/lib/canvas/canvasProjectProfile';

export function useCrearObraFromWizard() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const reset = useWizardStore((s) => s.reset);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crear = useCallback(async () => {
    const state = useWizardStore.getState();
    const { obraProductKind, direccion, propietario, latitud, longitud, plantas, terreno, superficies } =
      state;

    if (!currentUser?.orgId) {
      setError('No se pudo obtener la organización.');
      return;
    }
    if (!obraProductKind) {
      setError('Elegí el tipo de obra.');
      return;
    }

    const light = isLightObraProductKind(obraProductKind);
    const dir = (direccion ?? '').trim();
    const prop = (propietario ?? '').trim();

    if (!light && dir.length < 3) {
      setError('La dirección es obligatoria (mínimo 3 caracteres).');
      return;
    }
    if (!light && prop.length < 2) {
      setError('El propietario es obligatorio.');
      return;
    }
    if (light && prop.length < 2 && dir.length < 2) {
      setError('Indicá al menos un nombre de cliente o una referencia del trabajo.');
      return;
    }

    const label = OBRA_PRODUCT_KIND_LABEL[obraProductKind as ObraProductKind];
    const nombre = prop ? `${label} — ${prop}` : dir || label;

    setIsSaving(true);
    setError(null);

    try {
      const obraData: Record<string, unknown> = {
        org_id: currentUser.orgId,
        nombre,
        localizacion: dir || prop || nombre,
        propietario: prop || undefined,
        tipo_obra: obraProductKindToLegacyTipoObra(obraProductKind as ObraProductKind),
        obra_product_kind: obraProductKind,
        estado: 'pendiente',
      };

      if (latitud !== undefined) obraData.latitud = latitud;
      if (longitud !== undefined) obraData.longitud = longitud;

      if (!light) {
        if (plantas > 0) obraData.plantas = plantas;
        if (terreno > 0) obraData.terreno = terreno;
        if (superficies?.length) obraData.superficies = superficies;
      }

      const obraCreada = await crearObra(obraData as Parameters<typeof crearObra>[0]);

      if (!obraCreada?.id) {
        throw new Error('No se recibió el id de la obra');
      }

      seedSessionCanvasProjectKind(obraCreada.id, 'simple');
      seedSessionObraProductKind(obraCreada.id, obraProductKind as ObraProductKind);
      reset();
      router.push(`/cliente/tareas/${obraCreada.id}/editor` as Route);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la obra.');
    } finally {
      setIsSaving(false);
    }
  }, [currentUser?.orgId, reset, router]);

  return { crear, isSaving, error, setError };
}
