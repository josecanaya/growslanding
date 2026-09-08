'use client';

const ICON_PATHS: Record<string, string> = {
  estructura: 'M3 3.5h10M6 8h7M9 12.5h4',
  buscar:     'M11.2 11.2 14 14M12 7.2A4.8 4.8 0 1 1 2.4 7.2a4.8 4.8 0 0 1 9.6 0',
  archivo:    'M4 2.5h5l3 3v8H4zM9 2.5v3h3',
  capas:      'M8 2 2 5.2 8 8.4 14 5.2 8 2M2 8.8 8 12l6-3.2',
  filtros:    'M2.5 4.5h11M4.5 8h7M6.5 11.5h3',
  contexto:   'M2 4.2h4l1.2 1.6H14V12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4.2Z',
  ifc:        'M8 2 2.5 5v6L8 14l5.5-3V5L8 2M2.5 5 8 8l5.5-3M8 8v6',
  tareas:     'M2.5 3.5h11v9h-11zM5 8l2 2 4-4',
  socios:     'M5.5 7.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4M2 13c0-2 1.6-3.2 3.5-3.2S9 11 9 13M10.5 4a2 2 0 0 1 0 4M11.5 9.9c1.6.3 2.5 1.5 2.5 3.1',
  critico:    'M4 2v12M4 3h8l-1.6 3L12 9H4',
  cronograma: 'M2.5 3.5h11v10h-11zM2.5 6.5h11M5.5 2v2M10.5 2v2M5 9.5h3M6.5 11.5h4',
  presupuestos:'M3.5 2.5h9v11l-2-1.2-2 1.2-2-1.2-2 1.2zM6 6h4M6 8.5h4',
  pert:       'M8 2a1.6 1.6 0 1 0 0 3.2A1.6 1.6 0 0 0 8 2M4 10.8a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2M12 10.8a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2M8 5.2v2.4M8 7.6 4.6 10.6M8 7.6l3.4 3',
  historial:  'M8 4.5V8l2.5 1.5M2.6 8a5.4 5.4 0 1 0 1.6-3.8M2 3v2.4h2.4',
};

const GROUPS: { ids: string[]; sep?: boolean }[] = [
  { ids: ['estructura', 'buscar', 'archivo'] },
  { ids: ['capas', 'filtros'], sep: true },
  { ids: ['contexto', 'ifc', 'tareas', 'socios', 'critico', 'cronograma', 'presupuestos', 'pert', 'historial'], sep: true },
];

const TITLES: Record<string, string> = {
  estructura:   'Estructura',
  buscar:       'Buscar',
  archivo:      'Archivo',
  capas:        'Capas',
  filtros:      'Filtros',
  contexto:     'Contexto y archivos',
  ifc:          'Modelo IFC',
  tareas:       'Tareas operativas',
  socios:       'Socios',
  critico:      'Camino crítico',
  cronograma:   'Cronograma',
  presupuestos: 'Presupuestos',
  pert:         'Obra completa',
  historial:    'Historial',
};

type Props = {
  activePanel: string | null;
  onToggle: (id: string) => void;
};

function RailIcon({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: 16, height: 16 }}
    >
      <path d={d} />
    </svg>
  );
}

export function ToolRail({ activePanel, onToggle }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: '0 auto 0 0',
        width: 48,
        background: '#F4F4F1',
        borderRight: '1px solid #E4E3DE',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        paddingTop: 8,
        paddingBottom: 8,
        zIndex: 50,
      }}
    >
      {GROUPS.map((group, gi) => (
        <div key={gi} style={{ display: 'contents' }}>
          {gi > 0 && (
            <span
              style={{
                width: 20,
                height: 1,
                margin: '7px 0',
                background: '#DCDBD5',
                flexShrink: 0,
              }}
            />
          )}
          {group.ids.map((id) => {
            const active = activePanel === id;
            return (
              <button
                key={id}
                type="button"
                title={TITLES[id] ?? id}
                onClick={() => onToggle(id)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: active ? '1px solid #D3D2CC' : '1px solid transparent',
                  background: active ? '#FFFFFF' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: active ? '#0C1D36' : '#55565C',
                  transition: 'background 0.1s, color 0.1s, border-color 0.1s',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#E4E3DE';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
                  }
                }}
              >
                <RailIcon d={ICON_PATHS[id] ?? ''} />
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
