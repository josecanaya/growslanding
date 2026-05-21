'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, User } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import { cn } from '@/lib/utils';
import type { CanvasNode } from '@/lib/types/canvasMultinivel';
import { labelEstadoTarea, labelEstadoTareaFromDb } from './canvasMultinivelHelpers';
import type { CronogramaItem } from './buildCronogramaItems';
import {
  formatCronogramaDateLong,
  offsetToDate,
} from './buildCronogramaItems';

type Props = {
  obraId: string;
  selectedNode: CanvasNode | null;
  selectedItem: CronogramaItem | null;
  projectStart: Date;
  tareaPublicacionByNodeId: Record<
    string,
    { tareaId: string; estado: string; publishedAt: string | null }
  >;
  isOpen: boolean;
  onToggleOpen: () => void;
};

type TareaDetalle = {
  responsable: string | null;
  estado: string;
  evidencias: Array<{ evidencia_url?: string | null; evidencia_cargada?: boolean | null; estado?: string | null }>;
};

function evidenciaSrc(
  raw: string | null | undefined,
  supabase: ReturnType<typeof createClientComponentClient>,
): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim();
  if (/^https?:\/\//i.test(t)) return t;
  const { data } = supabase.storage.from('evidencias').getPublicUrl(t);
  return data.publicUrl;
}

function estadoHechoLabel(estado: string | undefined, local?: string): { label: string; tone: 'ok' | 'pending' | 'warn' | 'neutral' } {
  const e = (estado ?? local ?? '').toLowerCase();
  if (e.includes('validad') || e === 'validada' || e.includes('completad')) {
    return { label: 'Hecha · validada', tone: 'ok' };
  }
  if (e.includes('para_validar') || e.includes('validar')) {
    return { label: 'Enviada · pendiente de validación', tone: 'warn' };
  }
  if (e.includes('progreso') || e.includes('curso')) {
    return { label: 'En curso', tone: 'pending' };
  }
  if (e.includes('rechaz')) {
    return { label: 'Rechazada', tone: 'warn' };
  }
  if (e.includes('pendiente')) {
    return { label: 'Pendiente · no iniciada', tone: 'neutral' };
  }
  return { label: labelEstadoTareaFromDb(estado) || labelEstadoTarea(local as any) || 'Sin estado', tone: 'neutral' };
}

export function CanvasCronogramaInspector({
  selectedNode,
  selectedItem,
  projectStart,
  tareaPublicacionByNodeId,
  isOpen,
  onToggleOpen,
}: Props) {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [loading, setLoading] = useState(false);
  const [detalle, setDetalle] = useState<TareaDetalle | null>(null);

  const pub = selectedNode ? tareaPublicacionByNodeId[selectedNode.id] : undefined;
  const tareaId = pub?.tareaId;

  useEffect(() => {
    if (!tareaId) {
      setDetalle(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const res = await fetch(`/api/tareas/${encodeURIComponent(tareaId)}`, {
          credentials: 'include',
          cache: 'no-store',
        });
        const j = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && j.success && j.data) {
          setDetalle({
            responsable: j.data.responsable ?? null,
            estado: j.data.estado ?? pub?.estado ?? 'pendiente',
            evidencias: Array.isArray(j.data.evidencias) ? j.data.evidencias : [],
          });
        } else {
          setDetalle({
            responsable: selectedNode?.socioLabel ?? null,
            estado: pub?.estado ?? selectedNode?.estadoTarea ?? 'pendiente',
            evidencias: [],
          });
        }
      } catch {
        if (!cancelled) {
          setDetalle({
            responsable: selectedNode?.socioLabel ?? null,
            estado: pub?.estado ?? selectedNode?.estadoTarea ?? 'pendiente',
            evidencias: [],
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tareaId, pub?.estado, selectedNode?.socioLabel, selectedNode?.estadoTarea]);

  const hecho = estadoHechoLabel(detalle?.estado ?? pub?.estado, selectedNode?.estadoTarea);
  const fotos = useMemo(() => {
    if (!detalle?.evidencias.length) return [];
    return detalle.evidencias
      .map((ev) => evidenciaSrc(ev.evidencia_url, supabase))
      .filter((u): u is string => Boolean(u));
  }, [detalle?.evidencias, supabase]);

  const fechaFin =
    selectedItem != null
      ? formatCronogramaDateLong(offsetToDate(projectStart, selectedItem.endOffset))
      : null;
  const fechaInicio =
    selectedItem != null
      ? formatCronogramaDateLong(offsetToDate(projectStart, selectedItem.startOffset))
      : null;

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggleOpen}
        className="hidden shrink-0 self-start rounded-l-xl border border-r-0 border-[#e5e7eb] bg-white px-1 py-6 text-[#64748b] shadow-sm xl:flex"
        title="Abrir inspector"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    );
  }

  return (
    <aside className="hidden w-[min(100%,300px)] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] xl:flex">
      <div className="flex items-center justify-between border-b border-[#f1f5f9] px-3 py-2.5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">Cronograma</p>
          <p className="text-xs font-semibold text-[#64748b]">Solo lectura</p>
        </div>
        <button
          type="button"
          onClick={onToggleOpen}
          className="rounded-lg p-1.5 text-[#64748b] hover:bg-[#f8fafc]"
          title="Cerrar inspector"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {!selectedNode || selectedNode.type !== 'tarea' ? (
          <div className="rounded-xl border border-dashed border-[#e2e8f0] bg-[#f8fafc] px-4 py-10 text-center">
            <p className="text-sm font-semibold text-[#0f172a]">Seleccioná una tarea</p>
            <p className="mt-2 text-xs text-[#64748b]">
              El cronograma es solo visual. Para editar tareas, usá la pestaña Organizar.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-[#0f172a]">{selectedNode.title}</h2>
              {selectedItem ? (
                <p className="mt-1 text-[11px] text-[#64748b]">
                  {fechaInicio} → {fechaFin} · {selectedItem.duracionDias} días
                </p>
              ) : null}
            </div>

            <section className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">Responsable</p>
              {loading ? (
                <Loader2 className="mt-2 h-4 w-4 animate-spin text-[#64748b]" />
              ) : (
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#0f172a]">
                  <User className="h-4 w-4 text-[#64748b]" />
                  {detalle?.responsable || selectedNode.socioLabel || 'Sin asignar'}
                </p>
              )}
            </section>

            <section className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">Estado</p>
              <span
                className={cn(
                  'mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold',
                  hecho.tone === 'ok' && 'bg-emerald-100 text-emerald-800',
                  hecho.tone === 'warn' && 'bg-amber-100 text-amber-800',
                  hecho.tone === 'pending' && 'bg-blue-100 text-blue-800',
                  hecho.tone === 'neutral' && 'bg-slate-100 text-slate-700',
                )}
              >
                {hecho.label}
              </span>
              {pub?.publishedAt ? (
                <p className="mt-2 text-[11px] text-[#64748b]">
                  Publicada el{' '}
                  {new Date(pub.publishedAt).toLocaleDateString('es-AR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              ) : (
                <p className="mt-2 text-[11px] text-[#64748b]">Aún no publicada en operaciones</p>
              )}
            </section>

            <section className="rounded-xl border border-[#e5e7eb] bg-white p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                Evidencias / fotos
              </p>
              {loading ? (
                <Loader2 className="mt-3 h-4 w-4 animate-spin text-[#64748b]" />
              ) : fotos.length === 0 ? (
                <p className="mt-2 text-xs text-[#64748b]">Sin fotos enviadas todavía.</p>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {fotos.map((src) => (
                    <a
                      key={src}
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#f8fafc]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="Evidencia de tarea" className="aspect-square w-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </section>

            <p className="text-[10px] leading-relaxed text-[#94a3b8]">
              Vista de solo lectura. Editá duración, dependencias y checklist en Organizar.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
