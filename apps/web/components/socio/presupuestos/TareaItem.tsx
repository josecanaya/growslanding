'use client';

import { useEffect, useState } from 'react';
import { Calendar, Check, Edit3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatArgentineNumber, parseArgentineNumber } from '@/lib/utils/format';

// Formatea fechas cortas DD/MM/YYYY HH:mm
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

interface PresupuestoItem {
  id: string;
  tarea_id: string;
  estado: string;
  dias_reales: number | null;
  monto: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  tarea: {
    id: string;
    title: string | null;
    etapa: string | null;
    duracion_sugerida: number | null;
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
  };
  onFieldChange: (field: 'dias_reales' | 'monto', value: number | null) => void;
}

export function TareaItem({ presupuesto, editing, onFieldChange }: TareaItemProps) {
  // Solo mostrar planta y altura si existen, sin etapa
  const ubicacion = [presupuesto.elemento?.planta, presupuesto.elemento?.altura]
    .filter(Boolean)
    .join(' · ');

  const formatMontoForInput = (value: number | null): string => {
    if (value === null || value === undefined || isNaN(value)) return '';
    const hasDecimals = value % 1 !== 0;
    return formatArgentineNumber(hasDecimals ? Math.round(value * 100) / 100 : Math.round(value));
  };

  const [montoInputValue, setMontoInputValue] = useState<string>(
    editing.monto !== null ? formatMontoForInput(editing.monto) : '',
  );
  const [modoEdicion, setModoEdicion] = useState(false);

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

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 mb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="mb-2">
          <div className="text-sm font-semibold text-slate-900">
            {presupuesto.tarea?.title || 'Sin título'}
          </div>
          {presupuesto.elemento && presupuesto.elemento.cantidad != null && presupuesto.elemento.unidad && (
            <div className="text-base font-semibold text-slate-900">
              {presupuesto.elemento.cantidad.toLocaleString('es-AR', {
                minimumFractionDigits: presupuesto.elemento.cantidad % 1 === 0 ? 0 : 2,
                maximumFractionDigits: 2,
              })}{' '}
              {presupuesto.elemento.unidad}
            </div>
          )}
          {ubicacion && <div className="text-xs text-slate-500 mt-1">{ubicacion}</div>}
          <div className="mt-2 space-y-0.5">
            {presupuesto.created_at && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="h-3 w-3" />
                <span>Pedido el: {formatFecha(presupuesto.created_at)}</span>
              </div>
            )}
            {presupuesto.updated_at && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="h-3 w-3" />
                <span>Última actualización: {formatFecha(presupuesto.updated_at)}</span>
              </div>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setModoEdicion((prev) => !prev)}
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs border transition ${
            modoEdicion
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
          }`}
        >
          {modoEdicion ? (
            <>
              <Check className="h-3 w-3" /> Editando
            </>
          ) : (
            <>
              <Edit3 className="h-3 w-3" /> Editar
            </>
          )}
        </button>
      </div>

      {modoEdicion ? (
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              Días{' '}
              {presupuesto.tarea?.duracion_sugerida != null &&
              presupuesto.tarea.duracion_sugerida !== undefined
                ? `(${presupuesto.tarea.duracion_sugerida})`
                : ''}
            </label>
            <Input
              type="text"
              inputMode="decimal"
              value={
                editing.dias_reales !== null && editing.dias_reales !== undefined
                  ? editing.dias_reales.toString()
                  : ''
              }
              onChange={handleDiasChange}
              className="h-9 text-sm border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Monto</label>
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
              className="h-9 text-sm border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
              placeholder="0"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[11px] uppercase text-slate-500">Días</p>
            <p className="text-sm font-semibold text-slate-900">{diasValor || 0}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[11px] uppercase text-slate-500">Monto</p>
            <p className="text-sm font-semibold text-slate-900">
              {montoValor ? formatMontoForInput(montoValor) : '0'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
