'use client';

import type { CSSProperties } from 'react';

export interface PrintableObra {
  id?: string;
  name?: string | null;
  direccion_completa?: string | null;
  cliente?: string | null;
  fecha_inicio?: string | null;
}

export interface PrintablePresupuestoItem {
  id?: string;
  tarea_id: string;
  estado?: string;
  dias_reales: number | null;
  monto: number | null;
  observacion?: string | null;
  tarea?: {
    title?: string | null;
    etapa?: string | null;
  } | null;
  elemento?: {
    nombre?: string | null;
    cantidad?: number | null;
    unidad?: string | null;
  } | null;
}

interface PresupuestoPrintViewProps {
  obra: PrintableObra;
  presupuestos: PrintablePresupuestoItem[];
  nombreContratista: string;
  etapaLabel: string;
  fechaGeneracion?: Date;
  editing?: Map<string, { dias_reales: number | null; monto: number | null; observacion: string }>;
}

const styles: Record<string, CSSProperties> = {
  page: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    color: '#0f172a',
    background: '#ffffff',
    padding: '24mm 18mm',
    maxWidth: '210mm',
    margin: '0 auto',
    lineHeight: 1.4,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '2px solid #163274',
    paddingBottom: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    color: '#163274',
    margin: 0,
  },
  subtitle: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
  },
  metaTable: {
    width: '100%',
    fontSize: 11,
    borderCollapse: 'collapse',
    marginBottom: 16,
  },
  metaLabel: {
    width: '28%',
    padding: '4px 6px',
    color: '#475569',
    fontWeight: 600,
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
  },
  metaValue: {
    padding: '4px 8px',
    color: '#0f172a',
    border: '1px solid #e2e8f0',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    margin: '20px 0 8px',
    color: '#163274',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 11,
  },
  th: {
    background: '#163274',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 11,
    padding: '8px 10px',
    textAlign: 'left' as const,
    border: '1px solid #163274',
  },
  thNum: {
    background: '#163274',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 11,
    padding: '8px 10px',
    textAlign: 'right' as const,
    border: '1px solid #163274',
  },
  td: {
    padding: '8px 10px',
    border: '1px solid #e2e8f0',
    verticalAlign: 'top' as const,
  },
  tdNum: {
    padding: '8px 10px',
    border: '1px solid #e2e8f0',
    textAlign: 'right' as const,
    whiteSpace: 'nowrap' as const,
  },
  totalRow: {
    background: '#f8fafc',
    fontWeight: 700,
  },
  footer: {
    marginTop: 24,
    fontSize: 9,
    color: '#64748b',
    borderTop: '1px solid #e2e8f0',
    paddingTop: 10,
    display: 'flex',
    justifyContent: 'space-between',
  },
};

function formatMoneda(monto: number | null) {
  if (monto == null || Number.isNaN(monto)) return '—';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(monto);
}

function formatFecha(date: Date) {
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function PresupuestoPrintView({
  obra,
  presupuestos,
  nombreContratista,
  etapaLabel,
  fechaGeneracion = new Date(),
  editing,
}: PresupuestoPrintViewProps) {
  const filas = presupuestos.map((p) => {
    const e = editing?.get(p.tarea_id);
    const dias = e?.dias_reales ?? p.dias_reales;
    const monto = e?.monto ?? p.monto;
    return {
      ...p,
      _dias: dias,
      _monto: monto,
      _observacion: e?.observacion ?? p.observacion ?? '',
    };
  });

  const totalMonto = filas.reduce((acc, p) => acc + (p._monto || 0), 0);
  const totalDias = filas.reduce((acc, p) => acc + (p._dias || 0), 0);
  const subtotal = totalMonto;

  return (
    <div id="presupuesto-print-root" style={styles.page} data-print-root="presupuesto">
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Presupuesto de obra</h1>
          <p style={styles.subtitle}>
            {etapaLabel} · Generado el {formatFecha(fechaGeneracion)}
          </p>
        </div>
        <div style={{ textAlign: 'right' as const }}>
          <p style={{ ...styles.subtitle, marginTop: 0, fontWeight: 700, color: '#163274' }}>
            {nombreContratista}
          </p>
          <p style={styles.subtitle}>Grows · Construcción</p>
        </div>
      </header>

      <table style={styles.metaTable}>
        <tbody>
          <tr>
            <td style={styles.metaLabel}>Obra</td>
            <td style={styles.metaValue}>{obra.name || 'Sin nombre'}</td>
            <td style={styles.metaLabel}>Cliente</td>
            <td style={styles.metaValue}>{obra.cliente || '—'}</td>
          </tr>
          <tr>
            <td style={styles.metaLabel}>Dirección</td>
            <td style={styles.metaValue}>{obra.direccion_completa || '—'}</td>
            <td style={styles.metaLabel}>Fecha inicio</td>
            <td style={styles.metaValue}>
              {obra.fecha_inicio
                ? formatFecha(new Date(obra.fecha_inicio))
                : '—'}
            </td>
          </tr>
        </tbody>
      </table>

      <h2 style={styles.sectionTitle}>Detalle de tareas — {etapaLabel}</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>#</th>
            <th style={styles.th}>Tarea</th>
            <th style={{ ...styles.th, width: '14%' }}>Cantidad</th>
            <th style={{ ...styles.thNum, width: '10%' }}>Días</th>
            <th style={{ ...styles.thNum, width: '14%' }}>Precio unit.</th>
            <th style={{ ...styles.thNum, width: '16%' }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {filas.length === 0 ? (
            <tr>
              <td style={styles.td} colSpan={6}>
                Sin tareas para esta etapa.
              </td>
            </tr>
          ) : (
            filas.map((p, idx) => {
              const titulo = p.tarea?.title?.trim() || p.elemento?.nombre || 'Tarea';
              const cantidad =
                p.elemento?.cantidad != null
                  ? `${p.elemento.cantidad} ${p.elemento.unidad || ''}`.trim()
                  : '—';
              const precioUnit =
                p._monto && p._dias && p._dias > 0
                  ? formatMoneda(p._monto / Math.max(p._dias, 1))
                  : '—';
              return (
                <tr key={p.id ?? `${p.tarea_id}-${idx}`}>
                  <td style={styles.td}>{idx + 1}</td>
                  <td style={styles.td}>
                    <strong>{titulo}</strong>
                    {p._observacion ? (
                      <div style={{ color: '#475569', marginTop: 3 }}>{p._observacion}</div>
                    ) : null}
                  </td>
                  <td style={styles.td}>{cantidad}</td>
                  <td style={styles.tdNum}>{p._dias ?? '—'}</td>
                  <td style={styles.tdNum}>{precioUnit}</td>
                  <td style={styles.tdNum}>{formatMoneda(p._monto)}</td>
                </tr>
              );
            })
          )}
          <tr style={styles.totalRow}>
            <td style={styles.td} colSpan={3}>
              Totales
            </td>
            <td style={styles.tdNum}>{totalDias}</td>
            <td style={styles.tdNum}>—</td>
            <td style={styles.tdNum}>{formatMoneda(subtotal)}</td>
          </tr>
          <tr style={{ ...styles.totalRow, fontSize: 14 }}>
            <td style={{ ...styles.td, fontWeight: 800 }} colSpan={5}>
              TOTAL
            </td>
            <td style={{ ...styles.tdNum, color: '#163274', fontWeight: 800 }}>
              {formatMoneda(totalMonto)}
            </td>
          </tr>
        </tbody>
      </table>

      <footer style={styles.footer}>
        <span>Documento generado por la plataforma Grows.</span>
        <span>Página 1 / 1</span>
      </footer>
    </div>
  );
}
