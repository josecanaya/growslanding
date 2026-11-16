'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Barra, Estado, SinAcceso, dia, dinero, numero, panel, useLectura } from './comun';

/** Estado de los fondos ficticios del inversor y su posición en cada obra. */
export default function PosicionInversor() {
  const { datos, error, cargando } = useLectura<Record<string, any>>('/api/inversion/posicion');
  if (cargando) return <p className="text-sm text-[#718274]">Cargando tu posición…</p>;
  if (error || !datos) return <SinAcceso error={error ?? { status: 0, mensaje: '' }} volver="/inversores/posicion" />;
  const f = datos.fondos;
  return (
    <div className="space-y-5" data-testid="posicion-inversor">
      <p className="rounded-xl bg-[#fff4d6] px-4 py-3 text-sm text-[#6b5200]">Entorno de ensayo: saldo e importes ficticios ({datos.moneda}).</p>
      <section className={panel}>
        <h2 className="text-xl font-semibold">Estado de mis fondos</h2>
        <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-5">
          <div><dt className="text-xs text-[#718274]">Disponible</dt><dd className="text-lg font-semibold" data-testid="saldo">{dinero(f.saldo_disponible)}</dd></div>
          <div><dt className="text-xs text-[#718274]">Prometido sin integrar</dt><dd className="text-lg font-semibold">{dinero(f.prometido_sin_integrar)}</dd><dd className="text-xs text-[#718274]">Sigue en tu cuenta</dd></div>
          <div><dt className="text-xs text-[#718274]">En custodia de rondas</dt><dd className="text-lg font-semibold">{dinero(f.en_custodia_de_ronda)}</dd><dd className="text-xs text-[#718274]">Vuelve si la ronda falla</dd></div>
          <div><dt className="text-xs text-[#718274]">Aplicado a obras</dt><dd className="text-lg font-semibold">{dinero(f.aplicado_a_obras)}</dd></div>
          <div><dt className="text-xs text-[#718274]">Devuelto</dt><dd className="text-lg font-semibold">{dinero(f.devuelto)}</dd></div>
        </dl>
      </section>
      {datos.obras.map((o: any) => <section key={o.obra.id} className={panel} data-testid="posicion-obra">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{o.obra.nombre.replace(/^\[SIM\]\s*/, '')} {o.obra.simbolo && <span className="text-sm text-[#718274]">· {o.obra.simbolo}</span>}</h2>
          <Estado valor={o.obra.estado} />
        </div>
        <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-4">
          <div><dt className="text-xs text-[#718274]">MCU</dt><dd className="font-semibold">{numero(o.mi_posicion.mcu)}</dd></div>
          <div><dt className="text-xs text-[#718274]">Participación</dt><dd className="font-semibold">{numero(o.mi_posicion.participacion_pct)}%</dd></div>
          <div><dt className="text-xs text-[#718274]">Aportado</dt><dd className="font-semibold">{dinero(o.mi_posicion.costo_total)}</dd></div>
          <div><dt className="text-xs text-[#718274]">Distribuciones cobradas</dt><dd className="font-semibold">{dinero(o.mi_posicion.distribuciones_cobradas.reduce((s: number, d: any) => s + d.monto, 0))}</dd></div>
        </dl>
        <div className="mt-4 grid gap-4 sm:grid-cols-3"><Barra etiqueta="Avance físico" pct={o.avance_verificado.fisico_pct} /><Barra etiqueta="Certificado" pct={o.avance_verificado.certificado_pct} /><Barra etiqueta="Pagado" pct={o.avance_verificado.pagado_pct} /></div>
        <p className="mt-3 text-xs text-[#718274]">Fin previsto {dia(o.planificacion.fin_previsto)} · atraso {o.planificacion.atraso_dias} días · caja de obra {dinero(o.fondos_obra.caja)}</p>
        <Link className="mt-3 inline-block text-sm font-semibold underline" href={`/inversores?obra=${o.obra.id}&vista=inversor` as Route}>Ver la ficha de la obra</Link>
      </section>)}
      <section className={panel}>
        <h2 className="text-lg font-semibold">Movimientos de mi cuenta</h2>
        <table className="mt-3 w-full text-left text-sm"><thead><tr className="text-xs text-[#718274]"><th>Fecha</th><th>Concepto</th><th className="text-right">Importe</th></tr></thead>
          <tbody>{datos.movimientos.map((m: any) => <tr key={m.id} className="border-t border-[#eef2ed]"><td className="py-1.5">{dia(m.created_at)}</td><td>{m.descripcion || m.tipo.replace(/_/g, ' ')}</td><td className="text-right">{dinero(m.monto)}</td></tr>)}</tbody></table>
      </section>
    </div>
  );
}
