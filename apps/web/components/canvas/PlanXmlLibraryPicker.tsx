'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import {
  WIZARD_OBRA_PRODUCT_OPCIONES,
  isObraProductKind,
  type ObraProductKind,
} from '@/lib/canvas/obraProductKind';
import {
  filterCanvasXmlLibrary,
  listCanvasXmlLibrary,
  nearestCanvasXmlLibrary,
} from '@/lib/canvas/canvasXmlLibrary';
import type { TrabajoSimpleDetalle } from '@/lib/canvas/canvasXmlLibraryFilters';
import { CanvasXmlLibraryList } from '@/components/cliente/canvas-editor/CanvasXmlLibraryList';

type Props = {
  defaultObraProductKind?: string | null;
  onApplySlug: (slug: string) => void;
  applyingSlug?: string | null;
  /** Texto corto bajo el título (opcional). */
  hint?: string;
  /**
   * Si hay exactamente un plan filtrado, lo aplica solo (mismo comportamiento del canvas).
   * Desactivá en embeds donde el usuario debe confirmar.
   */
  autoApplySingle?: boolean;
  /** Título de la sección de resultados. */
  title?: string;
};

function numOrUndef(raw: string): number | undefined {
  const n = Number(raw);
  return raw.trim() === '' || Number.isNaN(n) ? undefined : n;
}

/**
 * Búsqueda filtrada de la librería XML (tipo, texto, m², pisos, ambientes…).
 * Compartido entre CanvasPlanWizardModal y Obra Check.
 */
export function PlanXmlLibraryPicker({
  defaultObraProductKind,
  onApplySlug,
  applyingSlug,
  hint = 'Buscá por texto y filtrá por m², pisos, ambientes, etc. Al tocar un plan se cargan las tareas del XML.',
  autoApplySingle = false,
  title = 'Buscar en librería',
}: Props) {
  const initialKind = isObraProductKind(defaultObraProductKind ?? '')
    ? (defaultObraProductKind as ObraProductKind)
    : 'casa';

  const [kind, setKind] = useState<ObraProductKind>(initialKind);
  const [detalle, setDetalle] = useState<TrabajoSimpleDetalle>('otro');
  const [search, setSearch] = useState('');
  const [m2, setM2] = useState('');
  const [plantas, setPlantas] = useState('');
  const [ambientes, setAmbientes] = useState('');
  const [complejidad, setComplejidad] = useState<'' | 'baja' | 'media' | 'alta'>('');
  const [unidades, setUnidades] = useState('');
  const [plantasEdificio, setPlantasEdificio] = useState('');
  const [deptosPorPiso, setDeptosPorPiso] = useState('');
  const [pbComercial, setPbComercial] = useState(false);
  const [subsueloCocheras, setSubsueloCocheras] = useState(false);
  const [amenities, setAmenities] = useState(false);

  const library = useMemo(() => listCanvasXmlLibrary(), []);

  const filter = useMemo(
    () => ({
      obraProductKind: kind,
      trabajoSimpleDetalle: kind === 'trabajo_simple' ? detalle : undefined,
      search: search.trim() || undefined,
      m2: numOrUndef(m2),
      plantas: kind === 'casa' || kind === 'reforma' ? numOrUndef(plantas) : undefined,
      ambientes: kind === 'casa' || kind === 'reforma' ? numOrUndef(ambientes) : undefined,
      complejidad: complejidad || undefined,
      unidades: kind === 'edificio' ? numOrUndef(unidades) : undefined,
      plantasEdificio: kind === 'edificio' ? numOrUndef(plantasEdificio) : undefined,
      deptosPorPiso: kind === 'edificio' ? numOrUndef(deptosPorPiso) : undefined,
      pbComercial: kind === 'edificio' && pbComercial ? true : undefined,
      subsueloCocheras: kind === 'edificio' && subsueloCocheras ? true : undefined,
      amenities: kind === 'edificio' && amenities ? true : undefined,
    }),
    [
      kind,
      detalle,
      search,
      m2,
      plantas,
      ambientes,
      complejidad,
      unidades,
      plantasEdificio,
      deptosPorPiso,
      pbComercial,
      subsueloCocheras,
      amenities,
    ],
  );

  const filtered = useMemo(() => filterCanvasXmlLibrary(library, filter), [library, filter]);
  const nearest = useMemo(
    () => (filtered.length === 0 ? nearestCanvasXmlLibrary(library, filter, 3) : []),
    [filtered.length, library, filter],
  );

  const autoAppliedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!autoApplySingle) return;
    if (applyingSlug || filtered.length !== 1) return;
    const slug = filtered[0]!.slug;
    if (autoAppliedRef.current === slug) return;
    autoAppliedRef.current = slug;
    onApplySlug(slug);
  }, [autoApplySingle, applyingSlug, filtered, onApplySlug]);

  function clearFilters() {
    setSearch('');
    setM2('');
    setPlantas('');
    setAmbientes('');
    setComplejidad('');
    setUnidades('');
    setPlantasEdificio('');
    setDeptosPorPiso('');
    setPbComercial(false);
    setSubsueloCocheras(false);
    setAmenities(false);
    autoAppliedRef.current = null;
  }

  const showCasaFilters = kind === 'casa' || kind === 'reforma';
  const showEdificioFilters = kind === 'edificio';
  const inputCls =
    'w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#001629] outline-none focus:border-[#002b49]';

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-[#001629]">{title}</p>
        {hint ? <p className="mt-1 text-xs text-[#64748b]">{hint}</p> : null}
      </div>

      <div>
        <p className="text-sm font-semibold text-[#001629]">Tipo de obra</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {WIZARD_OBRA_PRODUCT_OPCIONES.map((opt) => (
            <button
              key={opt.kind}
              type="button"
              onClick={() => {
                setKind(opt.kind);
                autoAppliedRef.current = null;
              }}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                kind === opt.kind
                  ? 'border-[#002b49] bg-[#002b49] text-white'
                  : 'border-[#cbd5e1] bg-white text-[#334155] hover:border-[#94a3b8]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
        <input
          className={`${inputCls} pl-9 pr-9`}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            autoAppliedRef.current = null;
          }}
          placeholder="Buscar: pintura, portón, casa 2 ambientes…"
        />
        {search ? (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#94a3b8] hover:bg-[#f1f5f9]"
            onClick={() => setSearch('')}
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {kind === 'trabajo_simple' ? (
        <div>
          <p className="text-sm font-semibold text-[#001629]">Intervención</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(
              [
                ['porton', 'Colocar portón'],
                ['puerta', 'Puerta interior'],
                ['otro', 'Ver todos los trabajos simples'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setDetalle(id);
                  autoAppliedRef.current = null;
                }}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  detalle === id
                    ? 'border-[#24a375] bg-[#ecfdf5] font-semibold text-[#065f46]'
                    : 'border-[#e2e8f0] text-[#475569]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#001629]">Filtros</p>
          <button type="button" className="text-xs font-medium text-[#64748b] hover:text-[#002b49]" onClick={clearFilters}>
            Limpiar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <label className="text-xs text-[#64748b]">
            m²
            <input
              className={`${inputCls} mt-1`}
              type="number"
              min={0}
              value={m2}
              onChange={(e) => {
                setM2(e.target.value);
                autoAppliedRef.current = null;
              }}
              placeholder="ej. 80"
            />
          </label>

          {showCasaFilters && (
            <>
              <label className="text-xs text-[#64748b]">
                Pisos / plantas
                <input
                  className={`${inputCls} mt-1`}
                  type="number"
                  min={0}
                  value={plantas}
                  onChange={(e) => {
                    setPlantas(e.target.value);
                    autoAppliedRef.current = null;
                  }}
                  placeholder="ej. 2"
                />
              </label>
              <label className="text-xs text-[#64748b]">
                Ambientes / habitaciones
                <input
                  className={`${inputCls} mt-1`}
                  type="number"
                  min={0}
                  value={ambientes}
                  onChange={(e) => {
                    setAmbientes(e.target.value);
                    autoAppliedRef.current = null;
                  }}
                  placeholder="ej. 3"
                />
              </label>
            </>
          )}

          {showEdificioFilters && (
            <>
              <label className="text-xs text-[#64748b]">
                Unidades
                <input
                  className={`${inputCls} mt-1`}
                  type="number"
                  min={0}
                  value={unidades}
                  onChange={(e) => {
                    setUnidades(e.target.value);
                    autoAppliedRef.current = null;
                  }}
                  placeholder="ej. 12"
                />
              </label>
              <label className="text-xs text-[#64748b]">
                Plantas edificio
                <input
                  className={`${inputCls} mt-1`}
                  type="number"
                  min={0}
                  value={plantasEdificio}
                  onChange={(e) => {
                    setPlantasEdificio(e.target.value);
                    autoAppliedRef.current = null;
                  }}
                  placeholder="ej. 5"
                />
              </label>
              <label className="text-xs text-[#64748b]">
                Deptos / piso
                <input
                  className={`${inputCls} mt-1`}
                  type="number"
                  min={0}
                  value={deptosPorPiso}
                  onChange={(e) => {
                    setDeptosPorPiso(e.target.value);
                    autoAppliedRef.current = null;
                  }}
                  placeholder="ej. 4"
                />
              </label>
            </>
          )}

          <label className="text-xs text-[#64748b]">
            Complejidad
            <select
              className={`${inputCls} mt-1`}
              value={complejidad}
              onChange={(e) => {
                setComplejidad(e.target.value as '' | 'baja' | 'media' | 'alta');
                autoAppliedRef.current = null;
              }}
            >
              <option value="">Cualquiera</option>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </label>
        </div>

        {showEdificioFilters && (
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#475569]">
            <label className="inline-flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={pbComercial}
                onChange={(e) => {
                  setPbComercial(e.target.checked);
                  autoAppliedRef.current = null;
                }}
              />
              PB comercial
            </label>
            <label className="inline-flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={subsueloCocheras}
                onChange={(e) => {
                  setSubsueloCocheras(e.target.checked);
                  autoAppliedRef.current = null;
                }}
              />
              Subsuelo / cocheras
            </label>
            <label className="inline-flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={amenities}
                onChange={(e) => {
                  setAmenities(e.target.checked);
                  autoAppliedRef.current = null;
                }}
              />
              Amenities
            </label>
          </div>
        )}
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-[#001629]">
          Resultados ({filtered.length})
        </p>
        {autoApplySingle && filtered.length === 1 && !applyingSlug ? (
          <p className="mb-2 text-xs text-[#64748b]">Un solo resultado: se carga automáticamente…</p>
        ) : null}

        {filtered.length > 0 ? (
          <CanvasXmlLibraryList entries={filtered} applyingSlug={applyingSlug} onSelect={onApplySlug} />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[#64748b]">
              No hay coincidencias exactas con esos filtros.
            </p>
            {nearest.length > 0 ? (
              <>
                <p className="text-xs font-semibold text-[#001629]">Sugerencias cercanas</p>
                <CanvasXmlLibraryList
                  entries={nearest}
                  applyingSlug={applyingSlug}
                  onSelect={onApplySlug}
                />
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
