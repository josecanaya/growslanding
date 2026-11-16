'use client';

import { useState } from 'react';
import { Aviso, Estado, SinAcceso, boton, botonSuave, campo, dia, dinero, numero, panel, subirEvidencia, useAccion, useLectura } from './comun';

type V = Record<string, any>;
const hoy = () => new Date().toISOString().slice(0, 10);

function Obra({ o, recargar }: { o: V; recargar: () => Promise<void> }) {
  const { ejecutar, ocupado, aviso, setAviso } = useAccion(o.obra.id, recargar);
  const [precios, setPrecios] = useState<Record<string, string>>({});
  const [plazo, setPlazo] = useState<Record<string, string>>({});
  const [pct, setPct] = useState<Record<string, string>>({});
  const [archivo, setArchivo] = useState<Record<string, File | null>>({});
  const adjuntar = async (entidad: 'avance' | 'certificado', id: string, clave: string) => {
    const file = archivo[clave];
    if (!file) return true;
    try { await subirEvidencia(o.obra.id, entidad, id, file); setArchivo({ ...archivo, [clave]: null }); return true; }
    catch (e) { setAviso({ tipo: 'error', texto: (e as Error).message }); return false; }
  };
  const partidasDe = (s: V) => (o.pliegos[0]?.revisiones.find((r: V) => r.id === s.revision_id)?.partidas ?? []).filter((p: V) => p.paquete === s.paquete);
  return (
    <section className={panel} data-testid="obra-contratista">
      <div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-semibold">{o.obra.nombre.replace(/^\[SIM\]\s*/, '')}</h2><Estado valor={o.obra.estado} /><span className="text-sm">Cobrado: <strong data-testid="cobrado">{dinero(o.cobrado)}</strong></span></div>
      <Aviso aviso={aviso} />

      {o.solicitudes.map((s: V) => <article key={s.id} className="mt-5 border-t border-[#eef2ed] pt-4" data-testid="solicitud">
        <div className="flex flex-wrap items-center gap-3"><h3 className="font-semibold">Pedido de cotización · {s.titulo}</h3><Estado valor={s.estado} /><span className="text-xs text-[#718274]">revisión {s.revision_numero} del pliego · límite {dia(s.fecha_limite)}</span></div>
        <table className="mt-2 w-full text-left text-sm"><thead><tr className="text-xs text-[#718274]"><th>Partida y alcance</th><th>Cantidad</th><th>Evidencia y criterio de aceptación</th><th>Precio unitario</th></tr></thead>
          <tbody>{partidasDe(s).map((p: V) => <tr key={p.id} className="border-t border-[#eef2ed] align-top"><td className="py-2 pr-3"><strong>{p.codigo}</strong> {p.titulo}<br /><span className="text-xs">{p.alcance}</span><br /><span className="text-xs text-[#718274]">{p.fuente} · rev. {p.fuente_revision}</span></td>
            <td className="pr-3 whitespace-nowrap">{numero(p.cantidad)} {p.unidad}</td><td className="pr-3 text-xs">{p.evidencia_requerida}<br />{p.criterio_aceptacion}</td>
            <td>{s.estado === 'abierta' ? <input aria-label={`Precio unitario ${p.codigo}`} inputMode="decimal" className={`${campo} max-w-[8rem]`} value={precios[`${s.id}:${p.codigo}`] ?? ''} onChange={(e) => setPrecios({ ...precios, [`${s.id}:${p.codigo}`]: e.target.value })} /> : '—'}</td></tr>)}</tbody></table>
        {s.mi_oferta && <p className="mt-2 text-sm">Tu oferta: <strong>{dinero(s.mi_oferta.monto_total)}</strong> en {s.mi_oferta.plazo_dias} días · <Estado valor={s.mi_oferta.estado} /></p>}
        {s.estado === 'abierta' && <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-sm">Plazo (días)<input inputMode="numeric" className={`${campo} max-w-[7rem]`} value={plazo[s.id] ?? ''} onChange={(e) => setPlazo({ ...plazo, [s.id]: e.target.value })} /></label>
          <button className={boton} disabled={ocupado !== null || !(Number(plazo[s.id]) > 0) || partidasDe(s).some((p: V) => !(Number(precios[`${s.id}:${p.codigo}`]) > 0))}
            onClick={() => void ejecutar('oferta-enviar', { solicitud_id: s.id, revision_id: s.revision_id, plazo_dias: Math.floor(Number(plazo[s.id])),
              items: partidasDe(s).map((p: V) => ({ partida_codigo: p.codigo, precio_unitario: Number(precios[`${s.id}:${p.codigo}`]) })) }, `Oferta enviada sobre la revisión ${s.revision_numero}.`)}>{s.mi_oferta ? 'Reemplazar oferta' : 'Enviar oferta'}</button></div>}
      </article>)}

      {o.contratos.map((k: V) => <article key={k.id} className="mt-5 border-t border-[#eef2ed] pt-4" data-testid="contrato">
        <div className="flex flex-wrap items-center gap-3"><h3 className="font-semibold">Contrato</h3><Estado valor={k.estado} /><span className="text-sm">{dinero(k.monto_total)} · revisión {k.revision_numero} · retención {numero(k.retencion_pct)}%</span></div>
        {k.adendas.filter((a: V) => a.estado === 'propuesta').map((a: V) => <div key={a.id} className="mt-2 rounded-xl bg-[#fff4d6] p-3 text-sm">Adenda propuesta: {a.motivo} · {dinero(a.monto_anterior)} → {dinero(a.monto_nuevo)}
          <button className={`${boton} ml-3`} disabled={ocupado !== null} onClick={() => void ejecutar('adenda-responder', { adenda_id: a.id, acepta: true }, 'Adenda aceptada.')}>Aceptar</button>
          <button className={`${botonSuave} ml-2`} disabled={ocupado !== null} onClick={() => void ejecutar('adenda-responder', { adenda_id: a.id, acepta: false }, 'Adenda rechazada.')}>Rechazar</button></div>)}
        {k.estado === 'vigente' && !o.certificados.some((c: V) => c.contrato_id === k.id && c.estado !== 'aprobado') && <div className="mt-3 rounded-xl bg-[#f2f5ee] p-4">
          <p className="text-sm font-semibold">Presentar certificado (porcentaje acumulado por partida)</p>
          <div className="mt-2 flex flex-wrap items-end gap-3">{k.items.map((i: V) => <label key={i.id} className="text-xs">{i.partida_codigo} · físico {numero(i.avance_fisico_pct)}% · certificado {numero(i.certificado_pct)}%
            <input aria-label={`Porcentaje ${i.partida_codigo}`} inputMode="decimal" className={`${campo} max-w-[7rem]`} value={pct[i.id] ?? ''} onChange={(e) => setPct({ ...pct, [i.id]: e.target.value })} /></label>)}
            <label className="text-xs">Evidencia<input type="file" className="block text-xs" onChange={(e) => setArchivo({ ...archivo, [`cert:${k.id}`]: e.target.files?.[0] ?? null })} /></label>
            <button className={boton} disabled={ocupado !== null || !k.items.some((i: V) => Number(pct[i.id]) > 0)} onClick={async () => {
              const res = await ejecutar('certificado-presentar', { contrato_id: k.id, fecha: hoy(), items: k.items.filter((i: V) => Number(pct[i.id]) > 0).map((i: V) => ({ contrato_item_id: i.id, porcentaje_acumulado: Number(pct[i.id]) })) }, 'Certificado presentado.');
              if (res && archivo[`cert:${k.id}`]) { archivo[`cert:${res.certificado_id}`] = archivo[`cert:${k.id}`]; if (await adjuntar('certificado', res.certificado_id, `cert:${res.certificado_id}`)) await recargar(); }
            }}>Presentar</button></div></div>}
      </article>)}

      {o.tareas.length > 0 && <article className="mt-5 border-t border-[#eef2ed] pt-4"><h3 className="font-semibold">Mis tareas</h3>
        {o.tareas.map((t: V) => <div key={t.id} className="mt-3 rounded-xl border border-[#eef2ed] p-3" data-testid="tarea" data-habilitada={t.habilitada}>
          <div className="flex flex-wrap items-center gap-3 text-sm"><strong>{t.clave} · {t.titulo}</strong><span>{t.frente}</span><span>{dia(t.plan.inicio)} – {dia(t.plan.fin)}</span><span>avance aceptado {numero(t.avance_fisico_pct)}%</span>
            <Estado valor={t.habilitada ? 'habilitada' : t.bloqueo === 'Terminada' ? 'terminada' : 'no_habilitada'} /></div>
          {!t.habilitada && t.bloqueo !== 'Terminada' && <p className="mt-1 text-xs text-[#8a5a00]">{t.bloqueo}</p>}
          {t.habilitada && !o.avances.some((a: V) => a.tarea_id === t.id && a.estado !== 'aceptado') && <div className="mt-2 flex flex-wrap items-end gap-3">
            <label className="text-xs">Avance acumulado %<input aria-label={`Avance ${t.clave}`} inputMode="decimal" className={`${campo} max-w-[7rem]`} value={pct[t.id] ?? ''} onChange={(e) => setPct({ ...pct, [t.id]: e.target.value })} /></label>
            <label className="text-xs">Evidencia<input type="file" className="block text-xs" onChange={(e) => setArchivo({ ...archivo, [`av:${t.id}`]: e.target.files?.[0] ?? null })} /></label>
            <button className={boton} disabled={ocupado !== null || !(Number(pct[t.id]) > t.avance_fisico_pct) || !archivo[`av:${t.id}`]} onClick={async () => {
              const res = await ejecutar('avance-informar', { tarea_id: t.id, fecha: hoy(), porcentaje: Number(pct[t.id]) }, 'Avance informado.');
              if (res) { archivo[`av:${res.avance_id}`] = archivo[`av:${t.id}`]; if (await adjuntar('avance', res.avance_id, `av:${res.avance_id}`)) await recargar(); }
            }}>Informar avance</button></div>}
        </div>)}</article>}

      {o.avances.filter((a: V) => a.estado !== 'aceptado').map((a: V) => <article key={a.id} className="mt-4 rounded-xl bg-[#f2f5ee] p-4" data-testid="avance-abierto">
        <div className="flex flex-wrap items-center gap-3 text-sm"><strong>{a.tarea}: {numero(a.porcentaje)}%</strong><Estado valor={a.estado} /><span className="text-xs text-[#718274]">{a.evidencias.length} evidencia(s)</span></div>
        {a.estado === 'observado' && <><p className="mt-1 text-sm">Observación: {a.observacion}</p><div className="mt-2 flex flex-wrap items-end gap-3">
          <label className="text-xs">Nueva evidencia<input type="file" className="block text-xs" onChange={(e) => setArchivo({ ...archivo, [`av:${a.id}`]: e.target.files?.[0] ?? null })} /></label>
          <button className={boton} disabled={ocupado !== null || !archivo[`av:${a.id}`]} onClick={async () => { if (await adjuntar('avance', a.id, `av:${a.id}`)) await ejecutar('avance-corregir', { avance_id: a.id }, 'Corrección enviada.'); }}>Corregir y reenviar</button></div></>}
      </article>)}

      {o.certificados.map((c: V) => <article key={c.id} className="mt-5 border-t border-[#eef2ed] pt-4" data-testid="certificado">
        <div className="flex flex-wrap items-center gap-3"><h3 className="font-semibold">Certificado N° {c.numero}</h3><Estado valor={c.pago ? 'pagado' : c.estado} /><span className="text-sm">neto {dinero(c.monto_neto)} · versión {c.version}</span></div>
        {c.motivo_rechazo && c.estado === 'rechazado' && <p className="mt-1 text-sm text-red-800">Motivo de rechazo: {c.motivo_rechazo}</p>}
        <p className="mt-1 text-xs text-[#718274]">Evidencia: {c.evidencias.map((e: V) => `v${e.version} ${e.nombre}`).join(', ') || 'sin adjuntos'} · {c.historial.map((h: V) => h.accion).join(' → ')}</p>
        {(c.estado === 'presentado' || c.estado === 'rechazado') && <div className="mt-2 flex flex-wrap items-end gap-3">
          <label className="text-xs">{c.estado === 'rechazado' ? 'Evidencia de la corrección' : 'Agregar evidencia'}<input type="file" className="block text-xs" onChange={(e) => setArchivo({ ...archivo, [`cert:${c.id}`]: e.target.files?.[0] ?? null })} /></label>
          {c.estado === 'presentado' ? <button className={botonSuave} disabled={ocupado !== null || !archivo[`cert:${c.id}`]} onClick={async () => { if (await adjuntar('certificado', c.id, `cert:${c.id}`)) { setAviso({ tipo: 'ok', texto: 'Evidencia adjuntada.' }); await recargar(); } }}>Adjuntar</button>
            : <button className={boton} disabled={ocupado !== null || !archivo[`cert:${c.id}`]} onClick={async () => { if (await adjuntar('certificado', c.id, `cert:${c.id}`)) await ejecutar('certificado-corregir', { certificado_id: c.id, items: c.items.map((i: V) => ({ contrato_item_id: i.contrato_item_id, porcentaje_acumulado: i.porcentaje_acumulado })) }, 'Certificado corregido y presentado de nuevo.'); }}>Corregir y volver a presentar</button>}</div>}
      </article>)}
    </section>
  );
}

/** Trabajo del contratista en el circuito: cotizar la revisión recibida, ejecutar tareas habilitadas, evidenciar, certificar y corregir. */
export default function CircuitoContratista() {
  const { datos, error, cargando, recargar } = useLectura<V>('/api/socio/circuito');
  if (cargando) return <p className="text-sm text-[#718274]">Cargando tus contratos…</p>;
  if (error || !datos) return <SinAcceso error={error ?? { status: 0, mensaje: '' }} volver="/socio/circuito" />;
  if (!datos.obras.length) return <section className={panel}><p className="text-sm text-[#53695d]">Todavía no tenés pedidos de cotización ni contratos.</p></section>;
  return <div className="space-y-5" data-testid="circuito-contratista">{datos.obras.map((o: V) => <Obra key={o.obra.id} o={o} recargar={recargar} />)}</div>;
}
