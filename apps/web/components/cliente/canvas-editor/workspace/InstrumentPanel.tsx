'use client';

import type { ReactNode } from 'react';

type Props = {
  id: string;
  title: string;
  onClose: () => void;
  wide?: boolean;
  children: ReactNode;
};

export function InstrumentPanel({ title, onClose, wide, children }: Props) {
  const narrowStyle = {
    position: 'absolute' as const,
    top: 12,
    bottom: 12,
    left: 60,
    width: 320,
    zIndex: 45,
  };
  const wideStyle = {
    position: 'absolute' as const,
    left: 60,
    right: 384,
    top: 12,
    bottom: 76,
    zIndex: 45,
  };
  const style = wide ? wideStyle : narrowStyle;

  return (
    <div
      style={{
        ...style,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 8,
        border: '1px solid #E4E3DE',
        background: '#FFFFFF',
        boxShadow: '0 8px 24px rgba(21,22,26,0.10), 0 1px 2px rgba(21,22,26,0.05)',
        overflow: 'hidden',
      }}
    >
      {/* cabecera */}
      <div
        style={{
          height: 38,
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px 0 13px',
          borderBottom: '1px solid #E4E3DE',
          flexShrink: 0,
          gap: 8,
        }}
      >
        <span
          style={{
            flex: 1,
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: '#8B8C90',
          }}
        >
          {title}
        </span>
        <button
          type="button"
          onClick={onClose}
          title="Cerrar"
          style={{
            width: 22,
            height: 22,
            borderRadius: 5,
            border: 'none',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#8B8C90',
            flexShrink: 0,
          }}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            style={{ width: 10, height: 10 }}
          >
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>

      {/* cuerpo */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>{children}</div>
    </div>
  );
}

export function PanelNota({ text }: { text: string }) {
  return (
    <div
      style={{
        border: '1px dashed #D3D2CC',
        borderRadius: 6,
        padding: '10px 12px',
        fontSize: 10,
        lineHeight: 1.6,
        color: '#8B8C90',
      }}
    >
      {text}
    </div>
  );
}
