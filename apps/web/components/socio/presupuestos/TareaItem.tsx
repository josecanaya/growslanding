'use client';

import { useEffect, useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatArgentineNumber, parseArgentineNumber, formatPesos } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { presupuestoLineaEstado } from '@/lib/socio/presupuestoLineaEstado';

const formatFecha = (fecha: string | null | undefined): string => {
  if (!fecha) return '';
  try {
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const anio = date.getFullYear();
    const horas = String(date.getHours()).padStart(2, '0');
    const minutos = String(date.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
  } catch {
    return '';
  }
};

const NAVY = 'text-[#163274]';
const SURFACE = 'bg-white border-[#e2e8f0]';

interface PresupuestoItem {
  id: string;
  tarea_id: string;
  estado: string;
  dias_reales: number | null;
  observacion?: string | null;
  monto: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  tarea: {
    id: string;
    title: string | null;
    etapa: string | null;
    duracion_sugerida: number | null;
    canvas_node_id?: string | null;
  } | null;
  elemento: {
    nombre: string | null;
    planta: string | null;
    altura: string | null;
    cantidad: number | null;
    unidad: string | null;
  } | null;
}

interface TareaItemProps {
  presupuesto: PresupuestoItem;
  editing: {
    dias_reales: number | null;
    monto: number | null;
    observacion: string;
  };
  onFieldChange: (field: 'dias_reales' | 'monto' | 'observacion', value: number | null | string) => void;
  stitchMode?: boolean;
  breadcrumb?: string[];
  /** Fila legible tipo app; el detalle queda al expandir. */
  layout?: 'compact' | 'comfortable';
}

function estadoBadgeClass(key: string, stitchMode: boolean) {
  switch (key) {
    case 'aprobada':
      return stitchMode
        ? 'bg-[#d8e2ff] text-[#163274] border-[#163274]/20'
        : 'bg-slate-100 text-slate-800 border-slate-200';
    case 'enviada':
      return stitchMode
        ? 'bg-[#163274]/10 text-[#163274] border-[#163274]/25'
        : 'bg-slate-100 text-slate-800 border-slate-200';
    case 'lista':
      return 'bg-sky-50 text-sky-900 border-sky-200';
    case 'incompleta':
      return 'bg-amber-50 text-amber-900 border-amber-200';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

export function TareaItem({
  presupuesto,
  editing,
  onFieldChange,
  stitchMode = false,
  breadcrumb,
  layout = 'compact',
}: TareaItemProps) {
  const ubicacion = [presupuesto.elemento?.planta, presupuesto.elemento?.altura].filter(Boolean).join(' · ');

  const formatMontoForInput = (value: number | null): string => {
    if (value === null || value === undefined || isNaN(value)) return '';
    const hasDecimals = value % 1 !== 0;
    return formatArgentineNumber(hasDecimals ? Math.round(value * 100) / 100 : Math.round(value));
  };

  const [montoInputValue, setMontoInputValue] = useState<string>(
    editing.monto !== null ? formatMontoForInput(editing.monto) : '',
  );
  const [expandido, setExpandido] = useState(false);

  useEffect(() => {
    setMontoInputValue(editing.monto !== null ? formatMontoForInput(editing.monto) : '');
  }, [editing.monto]);

  const handleDiasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === '' ? null : parseFloat(value.replace(/\./g, '').replace(',', '.'));
    if (numValue === null || (!isNaN(numValue) && numValue >= 0)) {
      onFieldChange('dias_reales', numValue);
    }
  };

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (value === '') {
      setMontoInputValue('');
      onFieldChange('monto', null);
      return;
    }
    value = value.replace(/[^\d.,]/g, '');
    const parts = value.split(',');
    if (parts.length > 2) value = parts[0] + ',' + parts.slice(1).join('');
    if (parts.length === 2 && parts[1].length > 2) value = parts[0] + ',' + parts[1].substring(0, 2);
    setMontoInputValue(value);
    const numValue = parseArgentineNumber(value);
    if (numValue === null || (!isNaN(numValue) && numValue >= 0)) {
      onFieldChange('monto', numValue);
    }
  };

  const diasValor = editing.dias_reales ?? presupuesto.dias_reales ?? 0;
  const montoValor = editing.monto ?? presupuesto.monto ?? 0;
  const sug = presupuesto.tarea?.duracion_sugerida;

  const lineaEstado = presupuestoLineaEstado(presupuesto.estado, {
    monto: editing.monto ?? presupuesto.monto,
    dias_reales: editing.dias_reales ?? presupuesto.dias_reales,
  });

  const ubicacionCorta =
    [presupuesto.elemento?.nombre, ubicacion].filter(Boolean).join(' · ') || ubicacion || '';

  if (layout === 'compact') {
    return (
      <div
        className={cn(
          'rounded-2xl border border-slate-100 bg-white p-3.5 shadow-[0_4px_20px_rgba(22,50,116,0.04)]',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                  estadoBadgeClass(lineaEstado.key, stitchMode),
                )}
              >
                {lineaEstado.label}
              </span>
              {sug != null ? (
                <span className="text-[10px] font-medium text-slate-400">Sug. {sug} d</span>
              ) : null}
            </div>
            <h3
              className={cn(
                'mt-1.5 text-sm font-bold leading-snug text-[#163274]',
                stitchMode && 'font-stitch-headline',
              )}
            >
              {presupuesto.tarea?.title || 'Sin título'}
            </h3>
            {breadcrumb && breadcrumb.length > 0 ? (
              <p className="mt-0.5 line-clamp-1 text-[11px] text-[#43617c]">{breadcrumb.join(' · ')}</p>
            ) : null}
            {ubicacionCorta ? (
              <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">{ubicacionCorta}</p>
            ) : null}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Monto</p>
            <p className="text-sm font-bold tabular-nums text-[#163274]">
              {montoValor ? formatPesos(Number(montoValor)) : '—'}
            </p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">Plazo</p>
            <p className="text-sm font-bold tabular-nums text-[#163274]">{diasValor || '—'} d</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpandido((v) => !v)}
          className="mt-3 text-xs font-bold text-[#163274] underline-offset-2 hover:underline"
        >
          <span className="inline-flex items-center gap-1">
            <Edit3 className="h-3.5 w-3.5" />
            {expandido ? 'Cerrar edición' : 'Editar valores'}
            {expandido ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </span>
        </button>
        {expandido ? (
          <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Días (tu propuesta){' '}
                  {sug != null ? <span className="text-slate-400">· sug. {sug}</span> : null}
                </label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={
                    editing.dias_reales !== null && editing.dias_reales !== undefined
                      ? String(editing.dias_reales)
                      : ''
                  }
                  onChange={handleDiasChange}
                  className="h-11 rounded-xl border-slate-200 text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Monto (ARS)</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={montoInputValue}
                  onChange={handleMontoChange}
                  onBlur={(e) => {
                    const numValue = parseArgentineNumber(e.target.value);
                    if (numValue !== null && !isNaN(numValue)) {
                      const formatted = formatMontoForInput(numValue);
                      setMontoInputValue(formatted);
                      onFieldChange('monto', numValue);
                    } else if (e.target.value === '') {
                      setMontoInputValue('');
                    }
                  }}
                  className="h-11 rounded-xl border-slate-200 font-mono text-sm"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Observación (opcional)</label>
              <Textarea
                value={editing.observacion}
                onChange={(e) => onFieldChange('observacion', e.target.value)}
                placeholder="Notas para el cliente o la obra…"
                className="min-h-[72px] rounded-xl border-slate-200 text-sm"
                maxLength={4000}
              />
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn('mb-3 rounded-2xl border p-4 shadow-sm', SURFACE)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                estadoBadgeClass(lineaEstado.key, stitchMode),
              )}
            >
              {lineaEstado.label}
            </span>
            {sug != null && (
              <span className={cn('text-[11px] font-medium', stitchMode ? 'text-stitch-on-surface/70' : 'text-slate-500')}>
                Sugerido obra: {sug} d
              </span>
            )}
          </div>
          {breadcrumb && breadcrumb.length > 0 && (
            <p
              className={cn(
                'mb-1 line-clamp-2 text-[11px] leading-snug',
                stitchMode ? 'text-[#43617c]' : 'text-slate-500',
              )}
            >
              {breadcrumb.join(' → ')}
            </p>
          )}
          <h3 className={cn('text-base font-bold leading-snug', stitchMode ? 'font-stitch-headline text-[#163274]' : NAVY)}>
            {presupuesto.tarea?.title || 'Sin título'}
          </h3>
          {presupuesto.elemento && presupuesto.elemento.cantidad != null && presupuesto.elemento.unidad && (
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {presupuesto.elemento.cantidad.toLocaleString('es-AR', {
                minimumFractionDigits: presupuesto.elemento.cantidad % 1 === 0 ? 0 : 2,
                maximumFractionDigits: 2,
              })}{' '}
              {presupuesto.elemento.unidad}
            </p>
          )}
          {ubicacion ? <p className="mt-0.5 text-xs text-slate-500">{ubicacion}</p> : null}
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 sm:w-[220px]">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-center sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tu plazo (d)</p>
            <p className={cn('text-lg font-bold tabular-nums', NAVY)}>{diasValor || '—'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-center sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Presupuesto</p>
            <p className={cn('text-lg font-bold tabular-nums', NAVY)}>
              {montoValor ? formatPesos(Number(montoValor)) : '—'}
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setExpandido((v) => !v)}
        className={cn(
          'mt-3 flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition',
          stitchMode
            ? 'border-[#163274]/20 bg-[#f7f9fb] text-[#163274] hover:bg-[#eceef0]'
            : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100',
        )}
      >
        <Edit3 className="h-4 w-4" />
        {expandido ? 'Cerrar edición' : 'Cargar / editar valores'}
        {expandido ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expandido && (
        <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Días (tu propuesta){' '}
                {sug != null ? <span className="text-slate-400">· sugerido {sug}</span> : null}
              </label>
              <Input
                type="text"
                inputMode="decimal"
                value={
                  editing.dias_reales !== null && editing.dias_reales !== undefined
                    ? String(editing.dias_reales)
                    : ''
                }
                onChange={handleDiasChange}
                className="h-11 rounded-xl border-slate-200 text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Monto (ARS)</label>
              <Input
                type="text"
                inputMode="decimal"
                value={montoInputValue}
                onChange={handleMontoChange}
                onBlur={(e) => {
                  const numValue = parseArgentineNumber(e.target.value);
                  if (numValue !== null && !isNaN(numValue)) {
                    const formatted = formatMontoForInput(numValue);
                    setMontoInputValue(formatted);
                    onFieldChange('monto', numValue);
                  } else if (e.target.value === '') {
                    setMontoInputValue('');
                  }
                }}
                className="h-11 rounded-xl border-slate-200 font-mono text-sm"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Observación (opcional)</label>
            <Textarea
              value={editing.observacion}
              onChange={(e) => onFieldChange('observacion', e.target.value)}
              placeholder="Notas para el cliente o la obra…"
              className="min-h-[72px] rounded-xl border-slate-200 text-sm"
              maxLength={4000}
            />
          </div>
        </div>
      )}

      <div className="mt-3 space-y-0.5 border-t border-dashed border-slate-100 pt-2">
        {presupuesto.created_at && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Calendar className="h-3 w-3" />
            <span>Pedido: {formatFecha(presupuesto.created_at)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
