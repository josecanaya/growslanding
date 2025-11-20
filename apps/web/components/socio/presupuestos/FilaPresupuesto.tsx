'use client';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/grows/Badge';
import { cn } from '@/lib/utils';

interface PresupuestoItem {
  id: string;
  tarea_id: string;
  estado: string;
  dias_reales: number | null;
  monto: number | null;
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
  } | null;
}

interface FilaPresupuestoProps {
  presupuesto: PresupuestoItem;
  onFieldChange: (field: 'dias_reales' | 'monto', value: number | null) => void;
  editing: {
    dias_reales: number | null;
    monto: number | null;
  };
  isMobile?: boolean;
}

export function FilaPresupuesto({
  presupuesto,
  onFieldChange,
  editing,
  isMobile = false,
}: FilaPresupuestoProps) {
  const handleDiasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === '' ? null : parseFloat(value);
    if (numValue === null || (!isNaN(numValue) && numValue >= 0)) {
      onFieldChange('dias_reales', numValue);
    }
  };

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === '' ? null : parseFloat(value);
    if (numValue === null || (!isNaN(numValue) && numValue >= 0)) {
      onFieldChange('monto', numValue);
    }
  };

  const getEtapaVariant = (etapa: string | null) => {
    if (!etapa) return 'default';
    const etapaUpper = etapa.toUpperCase();
    if (etapaUpper.includes('ESTRUCTURA')) return 'info';
    if (etapaUpper.includes('OBRA_GRIS') || etapaUpper.includes('GRIS')) return 'warning';
    if (etapaUpper.includes('TERMINACION')) return 'success';
    return 'default';
  };

  if (isMobile) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-3">
        <div>
          <h3 className="font-medium text-slate-900 text-sm">
            {presupuesto.tarea?.title || 'Sin título'}
          </h3>
          {presupuesto.tarea?.etapa && (
            <Badge variant={getEtapaVariant(presupuesto.tarea.etapa)} size="sm" className="mt-1">
              {presupuesto.tarea.etapa}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Duración sugerida</label>
            <div className="text-sm text-slate-600">
              {presupuesto.tarea?.duracion_sugerida !== null
                ? `${presupuesto.tarea.duracion_sugerida} días`
                : 'N/A'}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Días reales</label>
            <Input
              type="number"
              min="0"
              step="0.5"
              value={editing.dias_reales ?? ''}
              onChange={handleDiasChange}
              className="h-8 text-sm"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500 block mb-1">Monto</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={editing.monto ?? ''}
            onChange={handleMontoChange}
            className="h-8 text-sm"
            placeholder="0.00"
          />
        </div>

        {(presupuesto.elemento?.planta || presupuesto.elemento?.altura) && (
          <div className="text-xs text-slate-500">
            {presupuesto.elemento.planta && <span>Planta: {presupuesto.elemento.planta}</span>}
            {presupuesto.elemento.planta && presupuesto.elemento.altura && ' • '}
            {presupuesto.elemento.altura && <span>Altura: {presupuesto.elemento.altura}</span>}
          </div>
        )}
      </div>
    );
  }

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
      <td className="px-4 py-3 text-sm text-slate-900">
        <div className="font-medium">{presupuesto.tarea?.title || 'Sin título'}</div>
        {presupuesto.elemento?.nombre && (
          <div className="text-xs text-slate-500 mt-0.5">{presupuesto.elemento.nombre}</div>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600 text-center">
        {presupuesto.tarea?.duracion_sugerida !== null
          ? `${presupuesto.tarea.duracion_sugerida}`
          : 'N/A'}
      </td>
      <td className="px-4 py-3">
        <Input
          type="number"
          min="0"
          step="0.5"
          value={editing.dias_reales ?? ''}
          onChange={handleDiasChange}
          className="h-8 w-20 text-sm"
          placeholder="0"
        />
      </td>
      <td className="px-4 py-3">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={editing.monto ?? ''}
          onChange={handleMontoChange}
          className="h-8 w-24 text-sm"
          placeholder="0.00"
        />
      </td>
      <td className="px-4 py-3">
        {presupuesto.tarea?.etapa && (
          <Badge variant={getEtapaVariant(presupuesto.tarea.etapa)} size="sm">
            {presupuesto.tarea.etapa}
          </Badge>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {presupuesto.elemento?.planta && <div>Planta: {presupuesto.elemento.planta}</div>}
        {presupuesto.elemento?.altura && <div>Altura: {presupuesto.elemento.altura}</div>}
        {!presupuesto.elemento?.planta && !presupuesto.elemento?.altura && '-'}
      </td>
    </tr>
  );
}

