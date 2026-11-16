'use client';

import { useState } from 'react';
import { Aviso, Barra, Estado, boton, botonSuave, campo, dia, dinero, numero, panel, useAccion, useLectura } from './comun';

type Ficha = Record<string, any>;

/** Ficha de inversión de una obra del feed, con datos persistidos. Dinero ficticio de ensayo. */
export default function FichaInversion({ obraId, conSesion }: { obraId: string; conSesion: boolean }) {
  const { datos: f, error, cargando, recargar } = useLectura<Ficha>(`/api/inversion/obras/${obraId}`);
  const { ejecutar, ocupado, aviso } = useAccion(obraId, recargar);
  const [mcu, setMcu] = useState('');
  const [venta, setVenta] = useState({ cantidad: '', precio: '' });
  if (cargando) return <section className={panel}><p className="text-sm text-[#718274]">Cargando información de inversión…</p></section>;
  if (error || !f) return null; // obra publicada sin circuito de inversión: el feed muestra solo la publicación
  const r = f.ronda;
  const pos = f.mi_posicion;
  const cantidad = Math.floor(Number(mcu));
  const valido = r?.estado === 'abierta' && Number.isFinite(cantidad) && cantidad >= r.minimo_mcu && cantidad <= r.mcu_ofrecidas;
  return (
    <div className="space-y-5" data-testid="ficha-inversion">
      <p className="rounded-xl bg-[#fff4d6] px-4 py-3 text-sm text-[#6b5200]">Entorno de ensayo: los importes son dinero ficticio. No hay compras reales ni rendimiento garantizado.</p>
      {f.obra.estado !== 'normal' && <section role="status" className={`${panel} border-red-200`}>
        <h2 className="text-lg font-semibold">Estado de la obra: <Estado valor={f.obra.estado} /></h2>
        <p className="mt-2 text-sm text-[#53695d]">{f.obra.motivo_estado}{f.obra.reprogramada_hasta ? ` Reprogramada hasta ${dia(f.obra.reprogramada_hasta)}.` : ''}</p>
      </section>}
      {r ? <section className={panel} data-testid="ronda">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">{f.obra.simbolo ?? 'MCU'} · Ronda {r.numero}</h2><Estado valor={r.estado} /></div>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          <div><dt className="text-xs text-[#718274]">Aporte mínimo</dt><dd className="text-lg font-semibold" data-testid="aporte-minimo">{dinero(r.aporte_minimo)}</dd><dd className="text-xs text-[#718274]">{r.minimo_mcu} MCU</dd></div>
          <div><dt className="text-xs text-[#718274]">Precio ofrecido</dt><dd className="text-lg font-semibold">{dinero(r.precio_mcu)} / MCU</dd><dd className="text-xs text-[#718274]">Valuación previa {dinero(r.valuacion_pre)}</dd></div>
          <div><dt className="text-xs text-[#718274]">Cantidad ofrecida</dt><dd className="text-lg font-semibold">{numero(r.mcu_ofrecidas)} MCU</dd><dd className="text-xs text-[#718274]">Ya emitidas {numero(r.mcu_previas)}</dd></div>
          <div><dt className="text-xs text-[#718274]">Fecha</dt><dd>Abre {dia(r.fecha_apertura)} · cierra <strong>{dia(r.fecha_cierre)}</strong></dd></div>
          <div><dt className="text-xs text-[#718274]">Integrado (dinero en custodia)</dt><dd><strong>{numero(r.mcu_integradas)} MCU</strong> · {dinero(r.monto_integrado)}</dd><dd className="text-xs text-[#718274]">Cierra con al menos {numero(r.umbral_mcu)} MCU integradas</dd></div>
          <div><dt className="text-xs text-[#718274]">Prometido sin integrar</dt><dd>{numero(r.mcu_prometidas_sin_integrar)} MCU</dd><dd className="text-xs text-[#718274]">No cuenta como fondos de la obra</dd></div>
        </dl>
        <h3 className="mt-5 text-sm font-semibold">Qué se compra</h3><p className="text-sm text-[#53695d]">{r.que_se_compra}</p>
        <h3 className="mt-4 text-sm font-semibold">Destino de los fondos</h3>
        <ul className="text-sm text-[#53695d]">{r.destino_fondos.map((d: any, i: number) => <li key={i} className="flex justify-between border-b border-[#eef2ed] py-1"><span>{d.concepto}</span><span>{dinero(d.monto)}</span></li>)}</ul>
        <h3 className="mt-4 text-sm font-semibold">Condiciones de salida</h3><p className="text-sm text-[#53695d]">{r.condiciones_salida}</p>
        <p className="mt-4 text-xs text-[#718274]">Si la ronda se completa, los inversores nuevos tendrán {numero(r.efecto.participacion_nuevos_pct)}% y los anteriores {numero(r.efecto.participacion_anteriores_pct)}% del proyecto.</p>
        {r.estado === 'abierta' && (conSesion ? <form className="mt-5 rounded-xl bg-[#f2f5ee] p-4" onSubmit={(e) => { e.preventDefault(); if (valido) void ejecutar('suscribir', { ronda_id: r.id, mcu: cantidad }, 'Suscripción registrada. Todavía no integraste el dinero.').then((ok) => ok && setMcu('')); }}>
          <label htmlFor="mcu" className="text-sm font-semibold">¿Cuántas MCU querés suscribir?</label>
          <div className="mt-2 flex flex-wrap items-center gap-3"><input id="mcu" inputMode="numeric" className={`${campo} max-w-[10rem]`} value={mcu} onChange={(e) => setMcu(e.target.value)} placeholder={`mín. ${r.minimo_mcu}`} />
            <span className="text-sm" data-testid="monto-suscripcion">{valido ? `${dinero(cantidad * r.precio_mcu)} · ${numero((cantidad / (r.mcu_previas + r.mcu_ofrecidas)) * 100)}% si se completa` : `Entre ${r.minimo_mcu} y ${numero(r.mcu_ofrecidas)} MCU`}</span>
            <button className={boton} disabled={!valido || ocupado !== null}>Suscribir</button></div>
          <p className="mt-2 text-xs text-[#718274]">Suscribir es un compromiso. El dinero ficticio sale de tu cuenta recién cuando integrás, y pasa a la obra solo si la ronda cierra.</p>
        </form> : <a className={`${boton} mt-5 inline-block`} href={`/auth/login?redirect=${encodeURIComponent(`/inversores?obra=${obraId}&vista=inversor`)}`}>Ingresar para suscribir</a>)}
      </section> : <section className={panel}><p className="text-sm text-[#53695d]">Esta obra todavía no abrió rondas de inversión.</p></section>}
      <Aviso aviso={aviso} />
      {pos && <section className={panel} data-testid="mi-posicion">
        <h2 className="text-xl font-semibold">Mi posición</h2>
        <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-4">
          <div><dt className="text-xs text-[#718274]">MCU</dt><dd className="text-lg font-semibold" data-testid="mis-mcu">{numero(pos.mcu)}</dd></div>
          <div><dt className="text-xs text-[#718274]">Participación</dt><dd className="text-lg font-semibold">{numero(pos.participacion_pct)}%</dd></div>
          <div><dt className="text-xs text-[#718274]">Aportado</dt><dd className="text-lg font-semibold">{dinero(pos.costo_total)}</dd></div>
          <div><dt className="text-xs text-[#718274]">Unidad vinculada</dt><dd className="text-lg font-semibold">{pos.unidad ?? '—'}</dd></div>
        </dl>
        {pos.suscripciones.length > 0 && <table className="mt-4 w-full text-left text-sm"><thead><tr className="text-xs text-[#718274]"><th>Ronda</th><th>MCU</th><th>Monto</th><th>Estado</th><th /></tr></thead>
          <tbody>{pos.suscripciones.map((s: any) => <tr key={s.id} className="border-t border-[#eef2ed]"><td className="py-2">{s.ronda}</td><td>{numero(s.mcu)}</td><td>{dinero(s.monto)}</td><td><Estado valor={s.estado} /></td>
            <td className="space-x-2 text-right">{s.estado === 'prometida' && <>
              <button className={boton} disabled={ocupado !== null} onClick={() => void ejecutar('suscripcion-integrar', { suscripcion_id: s.id }, 'Integraste la suscripción: el dinero queda en custodia hasta el cierre de la ronda.')}>Integrar</button>
              <button className={botonSuave} disabled={ocupado !== null} onClick={() => void ejecutar('suscripcion-cancelar', { suscripcion_id: s.id }, 'Compromiso cancelado.')}>Cancelar</button></>}</td></tr>)}</tbody></table>}
        {pos.historial.length > 0 && <details className="mt-4 text-sm"><summary className="cursor-pointer font-semibold">Historial de MCU ({pos.historial.length})</summary>
          <ul className="mt-2">{pos.historial.map((h: any, i: number) => <li key={i} className="flex justify-between border-b border-[#eef2ed] py-1"><span>{h.tipo.replace(/_/g, ' ')}</span><span>{h.cantidad > 0 ? '+' : ''}{numero(h.cantidad)} MCU a {dinero(h.precio_mcu)}</span></li>)}</ul></details>}
      </section>}
      <section className={panel}>
        <h2 className="text-xl font-semibold">Avance verificado</h2>
        <p className="mb-3 text-xs text-[#718274]">Solo cuenta lo que la dirección de obra aceptó con evidencia. Avance físico, certificado y pagado son tres hechos distintos.</p>
        <div className="grid gap-4 sm:grid-cols-3"><Barra etiqueta="Avance físico" pct={f.avance_verificado.fisico_pct} /><Barra etiqueta="Certificado" pct={f.avance_verificado.certificado_pct} /><Barra etiqueta="Pagado" pct={f.avance_verificado.pagado_pct} /></div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div><dt className="text-xs text-[#718274]">Fin según línea base</dt><dd>{dia(f.planificacion.fin_linea_base)}</dd></div>
          <div><dt className="text-xs text-[#718274]">Fin previsto hoy</dt><dd>{dia(f.planificacion.fin_previsto)}</dd></div>
          <div><dt className="text-xs text-[#718274]">Atraso</dt><dd data-testid="atraso">{f.planificacion.atraso_dias} días</dd></div>
          <div><dt className="text-xs text-[#718274]">Caja de la obra</dt><dd>{dinero(f.fondos_obra.caja)}</dd></div>
          <div><dt className="text-xs text-[#718274]">Aportado por rondas cerradas</dt><dd>{dinero(f.fondos_obra.aportado_por_rondas)}</dd></div>
          <div><dt className="text-xs text-[#718274]">Pagado a contratistas</dt><dd>{dinero(f.fondos_obra.pagado_a_contratistas)}</dd></div>
        </dl>
      </section>
      <section className={panel} data-testid="mercado-secundario">
        <h2 className="text-xl font-semibold">Transferencias entre inversores</h2>
        <p className="mt-1 text-sm text-[#53695d]">{f.mercado_secundario.aviso}</p>
        {f.mercado_secundario.ordenes_abiertas.length === 0 ? <p className="mt-3 text-sm text-[#718274]">No hay órdenes de venta abiertas.</p> :
          <ul className="mt-3 text-sm">{f.mercado_secundario.ordenes_abiertas.map((o: any) => <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eef2ed] py-2">
            <span>{numero(o.cantidad)} MCU a {dinero(o.precio_mcu)} · total {dinero(o.monto)}{o.propia ? ' (tu orden)' : ''}</span>
            {conSesion && (o.propia ? <button className={botonSuave} disabled={ocupado !== null} onClick={() => void ejecutar('orden-venta-cancelar', { orden_id: o.id }, 'Orden retirada.')}>Retirar</button>
              : <button className={boton} disabled={ocupado !== null} onClick={() => void ejecutar('orden-venta-comprar', { orden_id: o.id }, 'Compra realizada: la posición es tuya y el dinero fue al vendedor.')}>Comprar</button>)}</li>)}</ul>}
        {pos && pos.mcu > 0 && <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); void ejecutar('orden-venta-crear', { cantidad: Math.floor(Number(venta.cantidad)), precio_mcu: Number(venta.precio) }, 'Orden publicada. Se concreta solo si alguien la compra.'); }}>
          <label className="text-sm">MCU a ofrecer<input className={campo} inputMode="numeric" value={venta.cantidad} onChange={(e) => setVenta({ ...venta, cantidad: e.target.value })} /></label>
          <label className="text-sm">Precio por MCU<input className={campo} inputMode="decimal" value={venta.precio} onChange={(e) => setVenta({ ...venta, precio: e.target.value })} /></label>
          <button className={botonSuave} disabled={ocupado !== null || !(Number(venta.cantidad) > 0 && Number(venta.precio) > 0)}>Publicar orden de venta</button></form>}
      </section>
      <details className={panel}><summary className="cursor-pointer font-semibold">Supuestos del ensayo (reversibles)</summary>
        <dl className="mt-3 space-y-2 text-sm">{Object.entries(f.supuestos).filter(([k]) => k !== 'version').map(([k, v]) => <div key={k}><dt className="font-semibold capitalize">{k.replace(/([A-Z])/g, ' $1')}</dt><dd className="text-[#53695d]">{String(v)}</dd></div>)}</dl></details>
    </div>
  );
}
