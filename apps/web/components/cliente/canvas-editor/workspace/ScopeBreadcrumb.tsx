'use client';

type Props = {
  items: { id: string | null; title: string }[];
  onGo: (index: number) => void;
  onUp: () => void;
  upDisabled: boolean;
  nodeCount: number;
  taskCount: number;
  publishedCount: number;
  criticalCount: number | null;
  nivelLabel: string;
  vistaLabel: string;
};

export function ScopeBreadcrumb({
  items,
  onGo,
  onUp,
  upDisabled,
  nodeCount,
  taskCount,
  publishedCount,
  criticalCount,
  nivelLabel,
  vistaLabel,
}: Props) {
  const nodeLabel =
    nodeCount === 0
      ? 'vacío'
      : nodeCount === 1
        ? '1 cuadro'
        : `${nodeCount} cuadros`;

  const counterLabel = `${nodeLabel} · ${taskCount} t · ${publishedCount} pub · ${criticalCount ?? '—'} crít`;

  return (
    <div className="absolute left-5 top-4 z-30 flex items-center gap-0.5">
      <button
        type="button"
        onClick={onUp}
        disabled={upDisabled}
        title="Subir nivel"
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          border: '1px solid #E4E3DE',
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: upDisabled ? 0.35 : 1,
          cursor: upDisabled ? 'default' : 'pointer',
          flexShrink: 0,
        }}
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: 12, height: 12, color: '#55565C' }}
        >
          <path d="M10 3 5 8l5 5" />
        </svg>
      </button>

      {items.map((item, idx) => (
        <span key={item.id ?? 'root'} className="flex items-center">
          {idx > 0 && (
            <span
              style={{
                color: '#C9C8C1',
                fontSize: 11,
                margin: '0 1px',
                userSelect: 'none',
              }}
            >
              ›
            </span>
          )}
          {idx === items.length - 1 ? (
            <span
              title={`${nivelLabel} · ${vistaLabel}`}
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#15161A',
                padding: '1px 4px',
              }}
            >
              {item.title}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onGo(idx)}
              style={{
                fontSize: 12,
                color: '#8B8C90',
                padding: '1px 4px',
                borderRadius: 4,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#F1F0EB';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              {item.title}
            </button>
          )}
        </span>
      ))}

      <span
        style={{
          borderLeft: '1px solid #E4E3DE',
          paddingLeft: 11,
          marginLeft: 10,
          fontSize: 10,
          color: '#8B8C90',
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
        }}
      >
        {counterLabel}
      </span>
    </div>
  );
}
