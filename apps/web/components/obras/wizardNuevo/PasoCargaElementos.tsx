'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Layers } from 'lucide-react';
import { useWizardStore } from './useWizardStore';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { crearObra } from '@/services/obrasService';
import { hubSectionShell, hubPrimaryButton, hubSecondaryButton } from './nuevaObraHubStyles';
import {
  OBRA_PRODUCT_KIND_LABEL,
  obraProductKindToLegacyTipoObra,
  type ObraProductKind,
} from '@/lib/canvas/obraProductKind';
import { seedSessionCanvasProjectKind } from '@/lib/canvas/canvasProjectProfile';

type TemplateListItem = {
  slug: string;
  nombre: string;
  descripcion?: string;
  tareas: { titulo: string; orden: number }[];
};

type PasoTemplateYCrearProps = {
  onPrev: () => void;
  onFinish: () => void;
};

export default function PasoCargaElementos({ onPrev, onFinish }: PasoTemplateYCrearProps) {
  const router = useRouter();
  const currentUser = useCurrentUser();

  const direccion = useWizardStore((s) => s.direccion);
  const propietario = useWizardStore((s) => s.propietario);
  const obraProductKind = useWizardStore((s) => s.obraProductKind);
  const canvasTemplateSlug = useWizardStore((s) => s.canvasTemplateSlug);
  const setCanvasTemplate = useWizardStore((s) => s.setCanvasTemplate);
  const latitud = useWizardStore((s) => s.latitud);
  const longitud = useWizardStore((s) => s.longitud);
  const plantas = useWizardStore((s) => s.plantas);
  const terreno = useWizardStore((s) => s.terreno);
  const superficies = useWizardStore((s) => s.superficies);
  const m2Estimados = useWizardStore((s) => s.m2Estimados);
  const reset = useWizardStore((s) => s.reset);

  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getNombreObra = () => {
    const label =
      obraProductKind && obraProductKind in OBRA_PRODUCT_KIND_LABEL
        ? OBRA_PRODUCT_KIND_LABEL[obraProductKind as ObraProductKind]
        : 'Obra';
    if (propietario) return `${label} — ${propietario}`;
    return label;
  };

  useEffect(() => {
    if (!obraProductKind) return;
    let cancelled = false;
    setLoadingTemplates(true);
    void (async () => {
      try {
        const res = await fetch(
          `/api/canvas-templates?obra_product_kind=${encodeURIComponent(obraProductKind)}`,
        );
        const j = await res.json();
        if (cancelled) return;
        const list = Array.isArray(j.data) ? j.data : [];
        setTemplates(
          list.map((t: TemplateListItem & { slug: string }) => ({
            slug: t.slug,
            nombre: t.nombre,
            descripcion: t.descripcion,
            tareas: t.tareas ?? [],
          })),
        );
        if (list.length > 0) {
          const current = useWizardStore.getState().canvasTemplateSlug;
          const pick = list.find((t: { slug: string }) => t.slug === current) ?? list[0];
          setCanvasTemplate(pick.slug, pick.nombre);
        }
      } catch {
        if (!cancelled) setTemplates([]);
      } finally {
        if (!cancelled) setLoadingTemplates(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [obraProductKind, setCanvasTemplate]);

  const selected = templates.find((t) => t.slug === canvasTemplateSlug);

  const handleGuardarObra = async () => {
    if (!currentUser?.orgId) {
      setError('No se pudo obtener la organización. Por favor, iniciá sesión nuevamente.');
      return;
    }
    if (!obraProductKind || !canvasTemplateSlug) {
      setError('Elegí un tipo de obra y un template.');
      return;
    }
    if (!direccion || direccion.trim().length < 3) {
      setError('La dirección es obligatoria (mínimo 3 caracteres).');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const wizardState = useWizardStore.getState();
      const obraData = {
        org_id: currentUser.orgId,
        nombre: getNombreObra(),
        localizacion: direccion.trim(),
        propietario: propietario?.trim() || undefined,
        tipo_obra: obraProductKindToLegacyTipoObra(obraProductKind as ObraProductKind),
        obra_product_kind: obraProductKind,
        latitud: latitud !== undefined ? latitud : undefined,
        longitud: longitud !== undefined ? longitud : undefined,
        plantas: plantas !== undefined && plantas > 0 ? plantas : undefined,
        terreno: terreno !== undefined && terreno > 0 ? terreno : undefined,
        superficies: superficies && superficies.length > 0 ? superficies : undefined,
        estado: 'pendiente' as const,
      };

      const obraCreada = await crearObra(obraData);

      if (obraCreada?.id) {
        seedSessionCanvasProjectKind(obraCreada.id, 'simple');
        reset();
        onFinish();
        router.push(`/cliente/tareas/${obraCreada.id}/editor` as Route);
        return;
      }

      throw new Error('No se recibió el id de la obra');
    } catch (err: unknown) {
      console.error('[ERROR_CREAR_OBRA]', err);
      setError(err instanceof Error ? err.message : 'Error al crear la obra. Probá nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className={hubSectionShell()}>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Layers className="h-6 w-6 shrink-0 text-[#001629]" strokeWidth={1.75} />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#001629]">Template del canvas</h2>
            <p className="mt-0.5 text-sm text-[#42474d]">
              El canvas se abrirá con estas tareas ya conectadas. Podés editarlas después.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {loadingTemplates ? (
        <p className="text-sm text-[#596574]">Cargando templates…</p>
      ) : templates.length === 0 ? (
        <p className="text-sm text-[#596574]">No hay templates para este tipo. Volvé y elegí otro tipo.</p>
      ) : (
        <div className="mb-8 space-y-3">
          {templates.map((t) => {
            const active = t.slug === canvasTemplateSlug;
            return (
              <button
                key={t.slug}
                type="button"
                onClick={() => setCanvasTemplate(t.slug, t.nombre)}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  active
                    ? 'border-[#002b49] bg-[#f0f7fc] ring-1 ring-[#002b49]/20'
                    : 'border-[#dfe3e7] bg-white hover:border-[#c9d9ec]'
                }`}
              >
                <p className="font-bold text-[#001629]">{t.nombre}</p>
                {t.descripcion ? (
                  <p className="mt-1 text-sm text-[#596574]">{t.descripcion}</p>
                ) : null}
                <p className="mt-2 text-xs font-medium text-[#42474d]">
                  {t.tareas.length} tareas en secuencia
                </p>
              </button>
            );
          })}
        </div>
      )}

      {selected ? (
        <div className="mb-10 rounded-xl border border-[#dfe3e7] bg-[#f6fafc] p-5">
          <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#002b49]">
            Vista previa — {selected.nombre}
          </h3>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-[#171c1f]">
            {[...selected.tareas]
              .sort((a, b) => a.orden - b.orden)
              .map((task) => (
                <li key={task.orden}>{task.titulo}</li>
              ))}
          </ol>
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t border-[#eaeef2] pt-8 md:flex-row md:items-center md:justify-between">
        <button
          type="button"
          disabled={isSaving}
          onClick={onPrev}
          className={`${hubSecondaryButton()} w-full md:w-auto`}
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={handleGuardarObra}
          disabled={isSaving || !currentUser?.orgId || !canvasTemplateSlug}
          className={`${hubPrimaryButton()} w-full whitespace-nowrap px-10 md:w-auto`}
        >
          {isSaving ? 'Creando obra…' : 'Crear obra y abrir canvas'}
        </button>
      </div>
    </section>
  );
}
