/** Máximo de ofertores (socios) por paquete / pliego de trabajo. */
export const MAX_OFERTORES_POR_PLIEGO = 6;

export type PresupuestoRowMin = {
  id: string;
  monto: number;
  estado: string | null;
  tareaId: string;
  socioId: string | null;
  tareaTitulo: string;
  createdAt: string | null;
  cuadrilla: string;
  budgetGroupId: string | null;
  budgetGroupName: string | null;
};

export type OfertaPresupuestoBucket = {
  key: string;
  socioId: string | null;
  cuadrilla: string;
  rows: PresupuestoRowMin[];
};

export type PliegoPresupuestoBucket = {
  key: string;
  budgetGroupId: string | null;
  pliegoNombre: string;
  ofertas: OfertaPresupuestoBucket[];
};

export type PliegoEstadoVisual = 'aprobado' | 'pendiente' | 'mixto' | 'otro';

function normEstado(e: string | null | undefined): string {
  return String(e ?? '').toUpperCase();
}

export function puedeResponderPresupuesto(estado: string | null | undefined): boolean {
  const u = normEstado(estado);
  return u === 'ENVIADO' || u === 'PENDIENTE';
}

export function estadoVisualOferta(rows: { estado: string | null }[]): PliegoEstadoVisual {
  let pendientes = 0;
  let aprobados = 0;
  let enviados = 0;
  for (const r of rows) {
    const u = normEstado(r.estado);
    if (u === 'ENVIADO' || u === 'PENDIENTE') pendientes++;
    if (u === 'APROBADO' || u === 'ACEPTADO') aprobados++;
    if (u === 'ENVIADO') enviados++;
  }
  if (aprobados > 0 && pendientes === 0) return 'aprobado';
  if (enviados > 0 || pendientes > 0) {
    return aprobados > 0 ? 'mixto' : 'pendiente';
  }
  if (pendientes > 0) return 'otro';
  return 'otro';
}

export function estadoVisualPliego(ofertas: OfertaPresupuestoBucket[]): PliegoEstadoVisual {
  if (ofertas.length === 0) return 'otro';
  const visuals = ofertas.map((o) => estadoVisualOferta(o.rows));
  if (visuals.every((v) => v === 'aprobado')) return 'aprobado';
  if (visuals.some((v) => v === 'pendiente' || v === 'mixto')) return 'pendiente';
  if (visuals.some((v) => v === 'aprobado')) return 'mixto';
  return 'otro';
}

export function ofertasConPropuesta(ofertas: OfertaPresupuestoBucket[]): number {
  return ofertas.filter((o) =>
    o.rows.some((r) => {
      const u = normEstado(r.estado);
      return u === 'ENVIADO' || u === 'APROBADO' || u === 'ACEPTADO' || r.monto > 0;
    }),
  ).length;
}

export function groupPliegosEnObra(rows: PresupuestoRowMin[]): PliegoPresupuestoBucket[] {
  const pliegos = new Map<string, PliegoPresupuestoBucket>();

  for (const r of rows) {
    const pkgId = r.budgetGroupId ?? '__sin_paquete__';
    let pliego = pliegos.get(pkgId);
    if (!pliego) {
      pliego = {
        key: pkgId,
        budgetGroupId: r.budgetGroupId,
        pliegoNombre: r.budgetGroupName?.trim()
          ? r.budgetGroupName
          : r.budgetGroupId
            ? 'Paquete de trabajo'
            : 'Partidas sueltas',
        ofertas: [],
      };
      pliegos.set(pkgId, pliego);
    }

    const socioKey = r.socioId ?? '__sin_socio__';
    let oferta = pliego.ofertas.find((o) => o.key === socioKey);
    if (!oferta) {
      oferta = {
        key: socioKey,
        socioId: r.socioId,
        cuadrilla: r.cuadrilla,
        rows: [],
      };
      pliego.ofertas.push(oferta);
    }
    oferta.rows.push(r);
  }

  const list = [...pliegos.values()];
  for (const p of list) {
    p.ofertas.sort((a, b) =>
      a.cuadrilla.localeCompare(b.cuadrilla, 'es', { sensitivity: 'base' }),
    );
  }

  return list.sort((a, b) => {
    const va = estadoVisualPliego(a.ofertas);
    const vb = estadoVisualPliego(b.ofertas);
    const order = (v: PliegoEstadoVisual) => (v === 'pendiente' ? 0 : v === 'mixto' ? 1 : 2);
    if (order(va) !== order(vb)) return order(va) - order(vb);
    return a.pliegoNombre.localeCompare(b.pliegoNombre, 'es', { sensitivity: 'base' });
  });
}
