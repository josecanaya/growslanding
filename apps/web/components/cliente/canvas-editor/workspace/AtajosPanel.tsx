'use client';

import { InstrumentPanel } from './InstrumentPanel';

const ATAJOS: { label: string; desc: string }[] = [
  { label: 'Guardar', desc: 'Chip superior · guarda el estado actual en la nube' },
  { label: 'Deshacer', desc: 'Próximamente · no hay historial local de deshacer' },
  { label: 'Rehacer', desc: 'Próximamente · no hay historial local de rehacer' },
  { label: 'Duplicar', desc: 'Clic derecho en tarjeta · también Ctrl+D' },
  { label: 'Eliminar', desc: 'Clic derecho en tarjeta · también tecla Delete' },
  { label: 'Vincular tareas', desc: 'Activa conexión en el lienzo · también modo en la toolbar' },
  { label: 'Camino crítico', desc: 'Se calcula con CPM en la vista de tareas (holgura 0)' },
  { label: 'Línea base', desc: 'Próximamente' },
  { label: 'Duración', desc: 'Editá la duración en el inspector de la tarea' },
  { label: 'Obra completa', desc: 'Diagrama PERT · rail → instrumento Obra completa' },
  { label: 'Filtrar', desc: 'Rail → instrumento Filtros' },
  { label: 'Ordenar', desc: 'Próximamente' },
  { label: 'Zoom', desc: 'Controles del lienzo (esquina) o rueda del mouse' },
  { label: 'Ajustar vista', desc: 'Botón «Ajustar» en el lienzo de tareas' },
  { label: 'Crear grupo de presupuesto', desc: 'Usá el panel de presupuestos para crear grupos' },
  { label: 'Abrir grupo', desc: 'Seleccioná un grupo en el panel lateral' },
  { label: 'Enviar grupo a bolsa', desc: 'Enviá desde el detalle del grupo seleccionado' },
  { label: 'Vista semana (cronograma)', desc: 'Vista activa: semana' },
  { label: 'Solo publicadas (cronograma)', desc: 'Usá el filtro en la vista de cronograma' },
  { label: 'Críticas (cronograma)', desc: 'Usá el filtro en la vista de cronograma' },
  { label: 'Agrupar (cronograma)', desc: 'Usá el control de agrupación en la vista' },
];

type Props = {
  onClose: () => void;
};

export function AtajosPanel({ onClose }: Props) {
  return (
    <InstrumentPanel id="atajos" title="Atajos y ayuda" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {ATAJOS.map((a) => (
          <div
            key={a.label}
            style={{
              padding: '6px 8px',
              borderRadius: 5,
              borderBottom: '1px solid #E9E8E3',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: '#3D3E43' }}>{a.label}</div>
            <div style={{ fontSize: 9, color: '#8B8C90', marginTop: 1, lineHeight: 1.5 }}>{a.desc}</div>
          </div>
        ))}
      </div>
    </InstrumentPanel>
  );
}
