'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Layers } from 'lucide-react';
import { useWizardStore } from './useWizardStore';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { crearObra } from '@/services/obrasService';
import { DetalleObra } from '@/components/cliente/DetalleObra';
import { hubSectionShell, hubPrimaryButton, hubSecondaryButton } from './nuevaObraHubStyles';
import {
  CANVAS_PROJECT_KIND_LABEL,
  canvasProjectKindToLegacyApiTipoObra,
  seedSessionCanvasProjectKind,
  type CanvasProjectKind,
} from '@/lib/canvas/canvasProjectProfile';

type PasoCargaElementosProps = {
  onPrev: () => void;
  onFinish: () => void;
};

export default function PasoCargaElementos({ onPrev, onFinish }: PasoCargaElementosProps) {
  const router = useRouter();
  const currentUser = useCurrentUser();

  const direccion = useWizardStore((s) => s.direccion);
  const propietario = useWizardStore((s) => s.propietario);
  const tipoObra = useWizardStore((s) => s.tipoObra);
  const latitud = useWizardStore((s) => s.latitud);
  const longitud = useWizardStore((s) => s.longitud);
  const plantas = useWizardStore((s) => s.plantas);
  const terreno = useWizardStore((s) => s.terreno);
  const superficies = useWizardStore((s) => s.superficies);
  const reset = useWizardStore((s) => s.reset);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [obraCreadaId, setObraCreadaId] = useState<string | null>(null);
  const [mostrarDetalleConElementos, setMostrarDetalleConElementos] = useState(false);

  const getNombreObra = () => {
    const label =
      tipoObra && tipoObra in CANVAS_PROJECT_KIND_LABEL
        ? CANVAS_PROJECT_KIND_LABEL[tipoObra as CanvasProjectKind]
        : tipoObra || 'Obra';
    if (tipoObra && propietario) return `${label} — ${propietario}`;
    if (tipoObra) return label;
    if (propietario) return `Obra — ${propietario}`;
    return 'Nueva obra';
  };

  const handleGuardarObra = async () => {
    if (!currentUser?.orgId) {
      setError('No se pudo obtener la organización. Por favor, iniciá sesión nuevamente.');
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
        tipo_obra: tipoObra
          ? canvasProjectKindToLegacyApiTipoObra(tipoObra as CanvasProjectKind)
          : undefined,
        latitud: latitud !== undefined ? latitud : undefined,
        longitud: longitud !== undefined ? longitud : undefined,
        fecha_inicio_estimada: wizardState.fecha_inicio_estimada || undefined,
        plantas: plantas !== undefined && plantas > 0 ? plantas : undefined,
        terreno: terreno !== undefined && terreno > 0 ? terreno : undefined,
        superficies: superficies && superficies.length > 0 ? superficies : undefined,
        estado: 'pendiente' as const,
      };

      const obraCreada = await crearObra(obraData);

      if (obraCreada?.id && wizardState.tipoObra) {
        seedSessionCanvasProjectKind(obraCreada.id, wizardState.tipoObra as CanvasProjectKind);
      }

      if (obraCreada?.id) {
        setObraCreadaId(obraCreada.id);
      }

      reset();
      onFinish();
      router.push('/cliente/dashboard?section=obras');
    } catch (err: unknown) {
      console.error('[ERROR_CREAR_OBRA]', err);
      setError(err instanceof Error ? err.message : 'Error al crear la obra. Probá nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAgregarElementos = () => {
    if (obraCreadaId) {
      setMostrarDetalleConElementos(true);
    }
  };

  const volverLista = () => {
    router.push('/cliente/obras' as Route);
  };

  if (mostrarDetalleConElementos && obraCreadaId) {
    const obraParaDetalle: Parameters<typeof DetalleObra>[0]['obra'] = {
      id: obraCreadaId,
      nombre: getNombreObra(),
      cliente: propietario || 'Cliente',
      tipoObra: (tipoObra as 'nueva' | 'reforma' | 'ampliacion') || 'nueva',
      fechaInicio: new Date().toISOString(),
      descripcion: '',
      numeroPermiso: 'SIN-PERMISO',
      progreso: 0,
      tareasActivas: 0,
      tareasCompletadas: 0,
      estado: 'activa',
      legajoTecnico: [],
    };

    return (
      <DetalleObra
        obra={obraParaDetalle}
        tareas={[]}
        tabInicial="elementos"
        onVolver={() => {
          setMostrarDetalleConElementos(false);
          reset();
          onFinish();
          router.push('/obras');
        }}
        onActualizarTarea={() => {}}
        onCrearTarea={() => {}}
        onCrearTareas={() => {}}
        onEliminarTarea={() => {}}
        onActualizarObra={() => {}}
      />
    );
  }

  return (
    <section className={hubSectionShell()}>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Layers className="h-6 w-6 shrink-0 text-[#001629]" strokeWidth={1.75} />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#001629]">
              <span data-onboarding="cargar-elementos">Revisión y creación</span>
            </h2>
            <p className="mt-0.5 text-sm text-[#42474d]">
              Opcionalmente agregás elementos después. Aquí cerramos el alta.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      <div className="mb-10 rounded-xl border border-[#dfe3e7] bg-[#f6fafc] p-5 md:p-6">
        <h3 className="mb-5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#002b49]">
          Resumen de carga
        </h3>
        <dl className="grid grid-cols-1 gap-4 text-sm text-[#171c1f] md:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#596574]">Tipo</dt>
            <dd className="mt-1 font-medium">
              {tipoObra && tipoObra in CANVAS_PROJECT_KIND_LABEL
                ? CANVAS_PROJECT_KIND_LABEL[tipoObra as CanvasProjectKind]
                : tipoObra || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#596574]">Propietario</dt>
            <dd className="mt-1 font-medium">{propietario || '—'}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#596574]">Dirección</dt>
            <dd className="mt-1 font-medium">{direccion?.trim() || '—'}</dd>
          </div>
          {typeof latitud === 'number' && typeof longitud === 'number' ? (
            <div className="md:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-[#596574]">
                Coordenadas
              </dt>
              <dd className="mt-1 break-all font-medium">
                {latitud.toFixed(6)}, {longitud.toFixed(6)}
              </dd>
            </div>
          ) : null}
          {plantas > 0 ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[#596574]">Plantas</dt>
              <dd className="mt-1 font-medium">{plantas}</dd>
            </div>
          ) : null}
          {terreno > 0 ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[#596574]">Terreno</dt>
              <dd className="mt-1 font-medium">{terreno} m²</dd>
            </div>
          ) : null}
          {superficies?.length > 0 ? (
            <div className="md:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-[#596574] mb-2">
                Superficies por planta
              </dt>
              <dd>
                <ul className="space-y-1.5 rounded-lg bg-white p-4 text-[#596574]">
                  {superficies.map((s) => (
                    <li key={s.planta} className="text-sm leading-relaxed text-[#171c1f]">
                      <span className="font-semibold text-[#001629]">Planta {s.planta}</span>{' '}
                      {s.cubiertos || 0} m² cubiertos · {s.descubiertos || 0} m² descubiertos
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ) : null}
          <div className="md:col-span-2 border-t border-[#eaeef2] pt-5">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#596574]">
              Nombre generado en GROWS
            </dt>
            <dd className="mt-1 text-lg font-bold text-[#001629]">{getNombreObra()}</dd>
          </div>
        </dl>
      </div>

      {obraCreadaId ? (
        <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
          <p className="font-bold text-emerald-950">¡Obra creada exitosamente!</p>
          <p className="mt-1 text-sm text-emerald-900/90">
            Podés agregar elementos constructivos como siguiente paso.
          </p>
          <button
            type="button"
            onClick={handleAgregarElementos}
            className={`${hubPrimaryButton()} mt-4 w-full sm:w-auto`}
          >
            Agregar elementos
          </button>
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
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:justify-end md:flex-none">
          <button
            type="button"
            disabled={isSaving}
            className={`${hubSecondaryButton()} w-full whitespace-nowrap sm:w-auto`}
            onClick={() => volverLista()}
          >
            Volver a obras
          </button>
          <button
            type="button"
            onClick={handleGuardarObra}
            disabled={isSaving || !currentUser?.orgId}
            className={`${hubPrimaryButton()} w-full whitespace-nowrap px-10 sm:w-auto`}
          >
            {isSaving ? 'Creando obra…' : 'Crear obra en GROWS'}
          </button>
        </div>
      </div>
    </section>
  );
}
