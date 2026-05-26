'use client';

export interface PrintableObra {
  name?: string | null;
}

export interface PrintablePresupuestoItem {
  tarea_id: string;
  tarea?: {
    title?: string | null;
  } | null;
  elemento?: {
    nombre?: string | null;
  } | null;
}

interface PresupuestoPrintViewProps {
  obra: PrintableObra;
  presupuestos: PrintablePresupuestoItem[];
  etapaLabel: string;
}

function tituloTarea(p: PrintablePresupuestoItem): string {
  return (p.tarea?.title?.trim() || p.elemento?.nombre?.trim() || 'Tarea sin nombre').trim();
}

/** Planilla A4 en blanco y negro para completar cantidades, días e importes a mano. */
export function PresupuestoPrintView({ obra, presupuestos, etapaLabel }: PresupuestoPrintViewProps) {
  const filas = [...presupuestos]
    .map((p) => ({ ...p, _titulo: tituloTarea(p) }))
    .sort((a, b) => a._titulo.localeCompare(b._titulo, 'es', { sensitivity: 'base' }));

  return (
    <div id="presupuesto-print-root" className="presupuesto-planilla" data-print-root="presupuesto">
      <header className="presupuesto-planilla-encabezado">
        <p className="presupuesto-planilla-meta">
          <span className="presupuesto-planilla-label">OBRA:</span>{' '}
          {obra.name?.trim() || 'Sin nombre'}
        </p>
        <p className="presupuesto-planilla-meta">
          <span className="presupuesto-planilla-label">ETAPA:</span> {etapaLabel}
        </p>
        <p className="presupuesto-planilla-meta">
          <span className="presupuesto-planilla-label">FECHA:</span>{' '}
          <span className="presupuesto-planilla-blank">__/__/____</span>
        </p>
        <p className="presupuesto-planilla-meta">
          <span className="presupuesto-planilla-label">SOCIO:</span>{' '}
          <span className="presupuesto-planilla-blank-line" aria-hidden="true">
            &nbsp;
          </span>
        </p>
      </header>

      <table className="presupuesto-planilla-tabla">
        <thead>
          <tr>
            <th className="presupuesto-planilla-th presupuesto-planilla-col-num">#</th>
            <th className="presupuesto-planilla-th presupuesto-planilla-col-tarea">Tarea</th>
            <th className="presupuesto-planilla-th presupuesto-planilla-col-campo">Cantidad</th>
            <th className="presupuesto-planilla-th presupuesto-planilla-col-campo">Días</th>
            <th className="presupuesto-planilla-th presupuesto-planilla-col-campo">Importe</th>
          </tr>
        </thead>
        <tbody>
          {filas.length === 0 ? (
            <tr>
              <td className="presupuesto-planilla-td" colSpan={5}>
                Sin tareas para esta etapa.
              </td>
            </tr>
          ) : (
            filas.map((p, idx) => (
              <tr key={p.tarea_id} className="presupuesto-planilla-fila">
                <td className="presupuesto-planilla-td presupuesto-planilla-col-num">{idx + 1}</td>
                <td className="presupuesto-planilla-td presupuesto-planilla-col-tarea">{p._titulo}</td>
                <td className="presupuesto-planilla-td presupuesto-planilla-col-campo presupuesto-planilla-vacio">
                  &nbsp;
                </td>
                <td className="presupuesto-planilla-td presupuesto-planilla-col-campo presupuesto-planilla-vacio">
                  &nbsp;
                </td>
                <td className="presupuesto-planilla-td presupuesto-planilla-col-campo presupuesto-planilla-vacio">
                  &nbsp;
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
