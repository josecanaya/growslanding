'use client';

import { useRouter } from 'next/navigation';
import type { Route } from 'next';

type Props = {
  obraNombre: string;
  onObraNombreChange: (v: string) => void;
  projectKind: string | null;
  cloudSaveState: string;
  cloudSaveMessage: string | null;
  canvasHydrated: boolean;
  guardadoRelativo: string | null;
  userLabel: string;
  onSaveCloud: () => void;
  onHelp: () => void;
};

export function ObraTopBar({
  obraNombre,
  onObraNombreChange,
  projectKind,
  cloudSaveState,
  cloudSaveMessage,
  canvasHydrated,
  guardadoRelativo,
  userLabel,
  onSaveCloud,
  onHelp,
}: Props) {
  const router = useRouter();
  const saving = cloudSaveState === 'saving';
  const err = cloudSaveState === 'err';
  const saveDisabled = !canvasHydrated || saving;

  const initials = userLabel
    ? userLabel
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase() ?? '')
        .join('')
    : '?';

  return (
    <div
      style={{
        height: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 12px',
        background: '#FFFFFF',
        borderBottom: '1px solid #E4E3DE',
        flexShrink: 0,
      }}
    >
      {/* ‹ volver */}
      <button
        type="button"
        onClick={() => router.push('/cliente/obras' as Route)}
        title="Volver a obras"
        style={{
          width: 26,
          height: 26,
          borderRadius: 6,
          border: '1px solid #E4E3DE',
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#55565C',
          flexShrink: 0,
        }}
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
          <path d="M10 3 5 8l5 5" />
        </svg>
      </button>

      {/* logo */}
      <span style={{ fontSize: 12, fontWeight: 700, color: '#15161A', flexShrink: 0 }}>Grows</span>

      {/* separador */}
      <span style={{ width: 1, height: 16, background: '#E4E3DE', flexShrink: 0 }} />

      {/* nombre de obra */}
      <input
        value={obraNombre}
        aria-label="Nombre de la obra"
        onChange={(e) => onObraNombreChange(e.target.value)}
        style={{
          border: 'none',
          background: 'transparent',
          fontSize: 12,
          fontWeight: 600,
          color: '#15161A',
          outline: 'none',
          minWidth: 0,
          maxWidth: 280,
        }}
      />

      {/* meta */}
      {projectKind ? (
        <span style={{ fontSize: 10, color: '#8B8C90', flexShrink: 0 }}>{projectKind}</span>
      ) : null}

      <span style={{ flex: 1 }} />

      {/* guardar */}
      <button
        type="button"
        onClick={onSaveCloud}
        disabled={saveDisabled}
        title={err ? 'Error al guardar — reintentar' : 'Guardar en la nube'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '2px 8px',
          borderRadius: 6,
          border: `1px solid ${err ? '#E4A12A' : '#E4E3DE'}`,
          background: '#FFFFFF',
          fontSize: 10,
          color: err ? '#8A6410' : '#55565C',
          cursor: saveDisabled ? 'default' : 'pointer',
          opacity: saveDisabled && !err ? 0.5 : 1,
          flexShrink: 0,
        }}
      >
        {saving ? (
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }}>
            <path d="M8 2a6 6 0 1 0 6 6" />
          </svg>
        ) : err ? (
          <svg viewBox="0 0 16 16" fill="none" stroke="#E4A12A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
            <path d="M13 10.3A6 6 0 1 0 5.7 3M8 7v4M8 13h.01" />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
            <path d="M13 10.3A6 6 0 1 0 5.7 3" /><path d="M10 10l3 3 3-3" />
          </svg>
        )}
        <span>{saving ? 'Guardando…' : (guardadoRelativo ?? 'Guardar')}</span>
      </button>

      {/* 🔔 notificaciones */}
      <button
        type="button"
        onClick={() => router.push('/cliente/notificaciones' as Route)}
        title="Notificaciones"
        style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#55565C', flexShrink: 0 }}
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
          <path d="M8 2a5 5 0 0 1 5 5v2.5l1 1.5H2l1-1.5V7a5 5 0 0 1 5-5zM6.5 13a1.5 1.5 0 0 0 3 0" />
        </svg>
      </button>

      {/* ⚙ cuenta */}
      <button
        type="button"
        onClick={() => router.push('/cliente/cuenta' as Route)}
        title="Cuenta y configuración"
        style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#55565C', flexShrink: 0 }}
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
          <circle cx="8" cy="5" r="2.5" /><path d="M2 13c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        </svg>
      </button>

      {/* ? ayuda */}
      <button
        type="button"
        onClick={onHelp}
        title="Atajos y ayuda"
        style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#55565C', flexShrink: 0 }}
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
          <circle cx="8" cy="8" r="6" /><path d="M6 6a2 2 0 1 1 2.8 1.8C8.4 8.1 8 8.5 8 9" /><circle cx="8" cy="11.5" r=".5" fill="currentColor" />
        </svg>
      </button>

      {/* avatar */}
      <div
        title={userLabel}
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: '#0C1D36',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 9,
          fontWeight: 700,
          flexShrink: 0,
          letterSpacing: '0.02em',
        }}
      >
        {initials}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
