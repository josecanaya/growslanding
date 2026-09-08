'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { parseHiloCanvasUi, type HiloLinea } from '@/lib/proyecto-vivo/hiloCanvasUi';

type BreadcrumbItem = { id: string | null; title: string };

type Props = {
  obraId: string;
  /** Breadcrumb del scope actual para el chip de contexto */
  breadcrumbItems: BreadcrumbItem[];
  /** IDs de nodos seleccionados (multi-selección) */
  selectedIds: string[];
  onClearSelection: () => void;
  onCanvasMaybeChanged: () => void;
  /** Abierto en modo expandido/foco por defecto cuando es true */
  defaultOpen?: boolean;
};

type BarState = 'collapsed' | 'expanded' | 'focused';

export function GrowsCommandBar({
  obraId,
  breadcrumbItems,
  selectedIds,
  onClearSelection,
  onCanvasMaybeChanged,
  defaultOpen,
}: Props) {
  const [barState, setBarState] = useState<BarState>(defaultOpen ? 'expanded' : 'collapsed');
  const [hilo, setHilo] = useState<HiloLinea[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isOpen = barState !== 'collapsed';

  const scopeLabel =
    breadcrumbItems.length > 0
      ? breadcrumbItems[breadcrumbItems.length - 1]!.title
      : 'Obra';

  const loadHilo = useCallback(async () => {
    try {
      const res = await fetch(`/api/obras/${encodeURIComponent(obraId)}/canvas`, {
        cache: 'no-store',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setHilo(parseHiloCanvasUi(json.data?.obra?.canvas_ui));
    } catch {
      /* ignore */
    }
  }, [obraId]);

  useEffect(() => {
    if (isOpen) void loadHilo();
  }, [isOpen, loadHilo]);

  useEffect(() => {
    if (isOpen) {
      scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
    }
  }, [hilo.length, isOpen]);

  useEffect(() => {
    if (barState === 'expanded' || barState === 'focused') {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [barState]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setBarState((s) => (s === 'collapsed' ? 'expanded' : 'collapsed'));
      }
      if (e.key === 'Escape' && barState !== 'collapsed') {
        setBarState('collapsed');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [barState]);

  const enviar = async () => {
    const mensaje = draft.trim();
    if (!mensaje || busy) return;
    setDraft('');
    setBusy(true);
    setError(null);
    const scopePathIds = breadcrumbItems.map((b) => b.id).filter((id): id is string => id !== null);
    setHilo((prev) => [
      ...prev,
      {
        id: `opt-${Date.now()}`,
        role: 'user',
        text: mensaje,
        at: new Date().toISOString(),
        ...(scopePathIds.length > 0 ? { scopePathIds } : {}),
        ...(selectedIds.length > 0 ? { selectionIds: selectedIds } : {}),
      },
    ]);
    try {
      const res = await fetch(`/api/obras/${encodeURIComponent(obraId)}/grafo/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje,
          historial: hilo.slice(-12).map((h) => ({ role: h.role, text: h.text.slice(0, 2000) })),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message ?? 'No se pudo seguir');
      if (Array.isArray(json.data?.hilo)) {
        setHilo(parseHiloCanvasUi({ hilo: json.data.hilo }));
      } else {
        await loadHilo();
      }
      if (json.data?.anotoPaso) onCanvasMaybeChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const sheetH = barState === 'focused' ? '60vh' : 420;
  const sheetW = barState === 'focused' ? '60vw' : 680;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none',
      }}
    >
      {/* Hoja expandida / foco */}
      {isOpen ? (
        <div
          style={{
            width: typeof sheetW === 'number' ? sheetW : sheetW,
            height: typeof sheetH === 'number' ? sheetH : sheetH,
            borderRadius: 8,
            border: '1px solid #D3D2CC',
            background: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(21,22,26,0.10), 0 1px 2px rgba(21,22,26,0.05)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            pointerEvents: 'auto',
            marginBottom: 8,
          }}
        >
          {/* header */}
          <div
            style={{
              height: 38,
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              borderBottom: '1px solid #E9E8E3',
              flexShrink: 0,
              gap: 8,
            }}
          >
            {/* chip scope */}
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: '#55565C',
                background: '#F4F4F1',
                border: '1px solid #D3D2CC',
                borderRadius: 4,
                padding: '1px 6px',
                maxWidth: 200,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              title={scopeLabel}
            >
              ⌗ {scopeLabel}
            </span>
            {/* chip selección */}
            {selectedIds.length > 0 ? (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#0C1D36',
                  background: '#E9EEF6',
                  border: '1px solid #B3C1D8',
                  borderRadius: 4,
                  padding: '1px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  flexShrink: 0,
                }}
              >
                ◆ {selectedIds.length} elemento{selectedIds.length !== 1 ? 's' : ''}
                <button
                  type="button"
                  onClick={onClearSelection}
                  title="Limpiar selección"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: '#4A6FA5',
                    lineHeight: 1,
                    fontSize: 11,
                  }}
                >
                  ✕
                </button>
              </span>
            ) : null}
            <span style={{ flex: 1 }} />
            <button
              type="button"
              onClick={() => setBarState(barState === 'focused' ? 'expanded' : 'focused')}
              title={barState === 'focused' ? 'Contraer' : 'Expandir foco'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#8B8C90',
                fontSize: 13,
                padding: '0 4px',
              }}
            >
              {barState === 'focused' ? '⊟' : '⊞'}
            </button>
            <button
              type="button"
              onClick={() => setBarState('collapsed')}
              title="Cerrar (Esc)"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#8B8C90',
                fontSize: 13,
                padding: '0 4px',
              }}
            >
              ✕
            </button>
          </div>

          {/* hilo */}
          <div
            ref={scroller}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {hilo.length === 0 && (
              <p style={{ fontSize: 13, lineHeight: 1.6, color: '#8B8C90' }}>
                Preguntá por lote, programa o gremios. Para dejar algo en el canvas:{' '}
                <span style={{ fontWeight: 600, color: '#3D3E43' }}>Definir programa → Unidades por piso</span>.
              </p>
            )}
            {hilo.map((m) => (
              <div key={m.id}>
                <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#A9A8A2', marginBottom: 2 }}>
                  {m.role === 'user' ? 'Vos' : 'Oficio'}
                </p>
                <p
                  style={{
                    whiteSpace: 'pre-wrap',
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: m.role === 'user' ? '#15161A' : '#3D3E43',
                  }}
                >
                  {m.text}
                </p>
                {m.scopePathIds && m.scopePathIds.length > 0 ? (
                  <p style={{ fontSize: 9, color: '#A9A8A2', marginTop: 2 }}>
                    Scope: {m.scopePathIds.join(' › ')}
                  </p>
                ) : null}
              </div>
            ))}
            {busy && <p style={{ fontSize: 11, color: '#A9A8A2' }}>Pensando…</p>}
            {error && <p style={{ fontSize: 11, color: '#A32A2A' }}>{error}</p>}
          </div>

          {/* input */}
          <form
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 8,
              borderTop: '1px solid #E9E8E3',
              padding: '10px 12px',
              flexShrink: 0,
            }}
            onSubmit={(e) => {
              e.preventDefault();
              void enviar();
            }}
          >
            <textarea
              ref={inputRef}
              style={{
                flex: 1,
                minWidth: 0,
                resize: 'none',
                border: '1px solid #D3D2CC',
                borderRadius: 6,
                padding: '6px 8px',
                fontSize: 13,
                lineHeight: 1.5,
                outline: 'none',
                fontFamily: 'inherit',
                minHeight: 56,
              }}
              placeholder={
                selectedIds.length > 1
                  ? `Relacioná estos ${selectedIds.length} elementos…`
                  : 'Preguntá o verbo → estado'
              }
              value={draft}
              rows={3}
              disabled={busy}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={() => { if (barState === 'expanded') setBarState('focused'); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void enviar();
                }
              }}
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              style={{
                marginBottom: 2,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: '#0C1D36',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                opacity: busy || !draft.trim() ? 0.4 : 1,
              }}
            >
              {busy ? (
                <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" />
              ) : (
                <Send style={{ width: 13, height: 13 }} />
              )}
              Enviar
            </button>
          </form>
        </div>
      ) : null}

      {/* Pill colapsada */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setBarState('expanded')}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setBarState('expanded'); }}
        style={{
          width: 560,
          height: 44,
          borderRadius: 9999,
          border: '1px solid #D3D2CC',
          background: '#FFFFFF',
          boxShadow: '0 4px 16px rgba(21,22,26,0.07), 0 1px 2px rgba(21,22,26,0.05)',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 16,
          paddingRight: 12,
          gap: 8,
          cursor: 'text',
          pointerEvents: 'auto',
        }}
      >
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, color: '#A9A8A2' }}>
          Preguntá o anotá un paso…
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: '#55565C',
            background: '#F4F4F1',
            border: '1px solid #D3D2CC',
            borderRadius: 4,
            padding: '1px 6px',
            maxWidth: 200,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
          title={scopeLabel}
        >
          ⌗ {scopeLabel}
        </span>
        {selectedIds.length > 0 ? (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: '#0C1D36',
              background: '#E9EEF6',
              border: '1px solid #B3C1D8',
              borderRadius: 4,
              padding: '1px 6px',
              flexShrink: 0,
            }}
          >
            ◆ {selectedIds.length}
          </span>
        ) : null}
        <span style={{ fontSize: 10, color: '#A9A8A2', fontWeight: 600, flexShrink: 0 }}>⌘K</span>
      </div>
    </div>
  );
}
