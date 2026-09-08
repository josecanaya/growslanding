'use client';

import { useState } from 'react';

type Layer = {
  id: string;
  label: string;
  defaultOn: boolean;
  hasEffect: boolean;
};

const LAYERS: Layer[] = [
  { id: 'planificacion', label: 'Planificación', defaultOn: true,  hasEffect: false },
  { id: 'tareas',        label: 'Tareas',        defaultOn: true,  hasEffect: true  },
  { id: 'estados',       label: 'Estados',       defaultOn: false, hasEffect: false },
  { id: 'transformaciones', label: 'Transformaciones', defaultOn: false, hasEffect: false },
  { id: 'contexto',     label: 'Contexto',       defaultOn: false, hasEffect: false },
  { id: 'ifc',          label: 'IFC',            defaultOn: false, hasEffect: false },
  { id: 'critico',      label: 'Camino crítico', defaultOn: true,  hasEffect: true  },
];

type Props = {
  layerTareas: boolean;
  onToggleTareas: () => void;
  layerCritico: boolean;
  onToggleCritico: () => void;
};

export function LayersControl({ layerTareas, onToggleTareas, layerCritico, onToggleCritico }: Props) {
  const [open, setOpen] = useState(false);

  const activeCount = [layerTareas, layerCritico].filter(Boolean).length +
    LAYERS.filter((l) => !['tareas', 'critico'].includes(l.id) && l.defaultOn).length;

  function isOn(id: string): boolean {
    if (id === 'tareas') return layerTareas;
    if (id === 'critico') return layerCritico;
    return LAYERS.find((l) => l.id === id)?.defaultOn ?? false;
  }

  function toggle(id: string) {
    if (id === 'tareas') { onToggleTareas(); return; }
    if (id === 'critico') { onToggleCritico(); return; }
    // Layers without real effect: visual only (toggle tracked in local state via parent's defaultOn)
  }

  return (
    <div style={{ position: 'relative' }}>
      {open ? (
        <div
          style={{
            position: 'absolute',
            bottom: 44,
            right: 0,
            width: 224,
            borderRadius: 8,
            border: '1px solid #E4E3DE',
            background: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(21,22,26,0.10), 0 1px 2px rgba(21,22,26,0.05)',
            overflow: 'hidden',
            zIndex: 60,
          }}
        >
          {/* header */}
          <div
            style={{
              height: 34,
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              borderBottom: '1px solid #E9E8E3',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#8B8C90', flex: 1 }}>
              Capas
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              title="Cerrar"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#8B8C90',
                fontSize: 12,
                padding: '0 2px',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* lista de capas */}
          <div style={{ padding: '6px 0' }}>
            {LAYERS.map((layer) => {
              const on = isOn(layer.id);
              return (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => toggle(layer.id)}
                  title={layer.hasEffect ? undefined : 'Capa aún sin fuente de datos'}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F6F5F1'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                >
                  {/* checkbox visual */}
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      border: `1.5px solid ${on ? '#0C1D36' : '#D3D2CC'}`,
                      background: on ? '#0C1D36' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'background 0.1s, border-color 0.1s',
                    }}
                  >
                    {on ? (
                      <svg viewBox="0 0 10 10" fill="none" style={{ width: 8, height: 8 }}>
                        <path d="M2 5l2.5 2.5L8 3" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: layer.hasEffect ? '#3D3E43' : '#8B8C90',
                      flex: 1,
                    }}
                  >
                    {layer.label}
                  </span>
                  {!layer.hasEffect ? (
                    <span style={{ fontSize: 8, color: '#B2B1AA' }}>—</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Capas"
        style={{
          height: 28,
          borderRadius: 6,
          border: '1px solid #D3D2CC',
          background: open ? '#FFFFFF' : '#F4F4F1',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '0 8px',
          cursor: 'pointer',
          fontSize: 10,
          fontWeight: 600,
          color: '#55565C',
          transition: 'background 0.1s',
        }}
      >
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" style={{ width: 13, height: 13 }}>
          <path d="M7 2 2 4.7 7 7.4 12 4.7 7 2M2 7.8 7 10.5l5-2.7" />
        </svg>
        {activeCount} capas
      </button>
    </div>
  );
}
