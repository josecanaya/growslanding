'use client';

import { useEffect, useState } from 'react';
import { Aviso, Barra, Estado, SinAcceso, boton, botonSuave, campo, dia, dinero, numero, panel, useAccion, useLectura } from './comun';

type V = Record<string, any>;
const SECCIONES = ['Pliego', 'Planificación', 'Cotizaciones', 'Certificaciones', 'Financiación'] as const;
const VACIA = { codigo: '', paquete: '', titulo: '', alcance: '', cantidad: '', unidad: '', fuente: '', fuente_revision: '', evidencia_requerida: '', criterio_aceptacion: '', responsable: '', precio_referencia: '', es_comun: false };

function CurvaS({ puntos }: { puntos: { fecha: string; planificado: number; fisico: number; certificado: number; pagado: number }[] }) {
  if (puntos.length < 2) return <p className="text-sm text-[#718274]">La curva S aparece al fijar la línea base.</p>;
  const max = Math.max(...puntos.map((p) => p.planificado), 1);
  const linea = (campoSerie: 'planificado' | 'fisico' | 'certificado' | 'pagado') => puntos.map((p, i) => `${(i / (puntos.length - 1)) * 600},${200 - (p[campoSerie] / max) * 190}`).join(' ');
  const series = [['planificado', '#9aa79c', 'Línea base'], ['fisico', '#19362d', 'Avance físico'], ['certificado', '#38826b', 'Certificado'], ['pagado', '#c58b1a', 'Pagado']] as const;
  return <figure data-testid="curva-s">
    <svg viewBox="0 0 600 205" role="img" aria-label="Curva S: línea base, avance físico, certificado y pagado" className="w-full">
      <line x1="0" y1="200" x2="600" y2="200" stroke="#dfe6df" />
      {series.map(([k, color]) => <polyline key={k} points={linea(k)} fill="none" stroke={color} strokeWidth={k === 'planificado' ? 2 : 2.5} strokeDasharray={k === 'planificado' ? '6 4' : undefined} />)}
    </svg>
    <figcaption className="mt-2 flex flex-wrap gap-4 text-xs">{series.map(([k, color, nombre]) => <span key={k} className="flex items-center gap-1.5"><i className="inline-block h-0.5 w-5" style={{ background: color }} />{nombre}: {dinero(puntos[puntos.length - 1][k])}</span>)}
      <span className="text-[#718274]">{dia(puntos[0].fecha)} → {dia(puntos[puntos.length - 1].fecha)}</span></figcaption>
  </figure>;
}

/** Circuito de una obra para responsable, coordinador y auditor. El contratista ve su parte en /socio/circuito. */
export default function CircuitoObra({ obraId }: { obraId: string }) {
  const { datos: v, error, cargando, recargar } = useLectura<V>(`/api/obras/${obraId}/circuito`);
  const { ejecutar, ocupado, aviso } = useAccion(obraId, recargar);
  const [seccion, setSeccion] = useState<typeof SECCIONES[number]>('Pliego');
  const [partida, setPartida] = useState<typeof VACIA>(VACIA);
  const [titulo, setTitulo] = useState('');
  const [agenda, setAgenda] = useState<{ id: string; nombre: string }[]>([]);
  const [solicitud, setSolicitud] = useState<{ paquete: string; socios: string[] }>({ paquete: '', socios: [] });
  const [motivos, setMotivos] = useState<Record<string, string>>({});
  const responsable = v?.rol === 'responsable';
  useEffect(() => {
    if (!responsable) return;
    void fetch('/api/cliente/socios/agenda', { credentials: 'include' }).then((r) => (r.ok ? r.json() : null)).then((d) => {
      const filas = (d?.data ?? d?.socios ?? d?.items ?? []) as any[];
      setAgenda(filas.map((x) => ({ id: x.socio_id ?? x.id, nombre: x.alias ?? x.nombre ?? x.socio?.nombre ?? x.email ?? 'Contratista' })).filter((x) => x.id));
    }).catch(() => undefined);
  }, [responsable]);
  if (cargando) return <p className="text-sm text-[#718274]">Cargando el circuito de la obra…</p>;
  if (error || !v) return <SinAcceso error={error ?? { status: 0, mensaje: '' }} volver={`/obras/${obraId}/circuito`} />;
  if (v.rol === 'contratista') return <section className={panel}><p>Tu trabajo en esta obra está en <a className="underline" href="/socio/circuito">Mis contratos</a>.</p></section>;
  const pliego = v.pliegos[0];
  const borrador = pliego?.revisiones.find((r: V) => r.estado === 'borrador');
  const publicada = pliego?.revisiones.find((r: V) => r.estado === 'publicada');
  const revision = borrador ?? publicada;
  const paquetes = [...new Set((publicada?.partidas ?? []).map((p: V) => p.paquete as string))] as string[];
  const fin = v.financiacion;
  const motivo = (id: string) => motivos[id] ?? '';
  return (
    <div className="space-y-5" data-testid="circuito-obra" data-rol={v.rol}>
      <div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-semibold">{v.obra.nombre.replace(/^\[SIM\]\s*/, '')}</h1><Estado valor={v.obra.estado} /><span className="rounded-full bg-[#e9f0e6] px-3 py-1 text-xs">Tu rol: {v.rol}</span></div>
      {v.obra.motivo_estado && v.obra.estado !== 'normal' && <p role="status" className="text-sm text-red-800">{v.obra.motivo_estado}</p>}
      <nav className="flex flex-wrap gap-2" aria-label="Secciones del circuito">{SECCIONES.map((s) => <button key={s} aria-pressed={seccion === s} onClick={() => setSeccion(s)} className={seccion === s ? boton : botonSuave}>{s}</button>)}</nav>
      <Aviso aviso={aviso} />

      {seccion === 'Pliego' && <section className={panel} data-testid="seccion-pliego">
        {!pliego ? (responsable ? <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); void ejecutar('pliego-crear', { titulo }, 'Pliego creado en ingeniería general.'); }}>
          <label className="text-sm">Título del pliego<input className={campo} value={titulo} onChange={(e) => setTitulo(e.target.value)} /></label><button className={boton} disabled={titulo.trim().length < 2 || ocupado !== null}>Crear pliego</button></form>
          : <p className="text-sm text-[#718274]">La obra todavía no tiene pliego.</p>) : <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">{pliego.titulo} · revisión {revision.numero}</h2>
            <span className="flex items-center gap-2 text-sm"><Estado valor={revision.estado} /> {revision.etapa.replace(/_/g, ' ')}</span>
          </div>
          {revision.motivo && <p className="mt-1 text-xs text-[#718274]">Motivo de la revisión: {revision.motivo}{revision.huella ? ` · huella ${revision.huella.slice(0, 10)}` : ''}</p>}
          <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm">
            <thead><tr className="text-xs text-[#718274]"><th>Partida</th><th>Alcance</th><th>Cantidad</th><th>Fuente y revisión</th><th>Evidencia</th><th>Criterio de aceptación</th><th>Responsable</th><th>Tareas</th></tr></thead>
            <tbody>{revision.partidas.map((p: V) => <tr key={p.id} className="border-t border-[#eef2ed] align-top">
              <td className="py-2 pr-3"><strong>{p.codigo}</strong> {p.titulo}<br /><span className="text-xs text-[#718274]">{p.paquete}{p.es_comun ? ' · común del edificio' : p.unidad_codigo ? ` · unidad ${p.unidad_codigo}` : ''}</span></td>
              <td className="pr-3">{p.alcance || <em className="text-red-700">falta</em>}</td>
              <td className="pr-3 whitespace-nowrap">{p.cantidad ? `${numero(p.cantidad)} ${p.unidad}` : <em className="text-red-700">falta</em>}</td>
              <td className="pr-3">{p.fuente ? `${p.fuente} · rev. ${p.fuente_revision}` : <em className="text-red-700">falta</em>}</td>
              <td className="pr-3">{p.evidencia_requerida || <em className="text-red-700">falta</em>}</td>
              <td className="pr-3">{p.criterio_aceptacion || <em className="text-red-700">falta</em>}</td>
              <td className="pr-3">{p.responsable || <em className="text-red-700">falta</em>}</td>
              <td className="text-xs">{p.tareas.map((t: V) => `${t.clave} (${t.frente}: ${numero(t.cantidad)})`).join(', ') || '—'}</td></tr>)}</tbody></table></div>
          {responsable && borrador && <>
            <form className="mt-5 grid gap-3 rounded-xl bg-[#f2f5ee] p-4 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault();
              const limpio = Object.fromEntries(Object.entries(partida).filter(([, val]) => val !== '').map(([k, val]) => [k, ['cantidad', 'precio_referencia'].includes(k) ? Number(val) : val]));
              void ejecutar('partidas-guardar', { revision_id: borrador.id, partidas: [limpio] }, 'Partida guardada.').then((ok) => ok && setPartida(VACIA)); }}>
              <p className="text-sm font-semibold sm:col-span-3">Agregar o completar una partida (por código)</p>
              {(['codigo', 'paquete', 'titulo', 'cantidad', 'unidad', 'precio_referencia', 'fuente', 'fuente_revision', 'responsable', 'alcance', 'evidencia_requerida', 'criterio_aceptacion'] as const).map((k) =>
                <label key={k} className="text-xs capitalize">{k.replace(/_/g, ' ')}<input className={campo} value={partida[k]} onChange={(e) => setPartida({ ...partida, [k]: e.target.value })} /></label>)}
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={partida.es_comun} onChange={(e) => setPartida({ ...partida, es_comun: e.target.checked })} /> Común del edificio</label>
              <button className={`${boton} sm:col-span-3 sm:justify-self-start`} disabled={!partida.codigo || ocupado !== null}>Guardar partida</button>
            </form>
            <div className="mt-4 flex flex-wrap gap-3">
              {borrador.etapa === 'ingenieria_general' && <button className={boton} disabled={ocupado !== null} onClick={() => void ejecutar('pliego-avanzar', { revision_id: borrador.id, etapa: 'ingenieria_detalle' }, 'Ingeniería general cerrada.')}>Pasar a ingeniería de detalle</button>}
              {borrador.etapa === 'ingenieria_detalle' && <button className={boton} disabled={ocupado !== null} onClick={() => void ejecutar('pliego-avanzar', { revision_id: borrador.id, etapa: 'publicable' }, 'Pliego publicado.')}>Publicar pliego</button>}
            </div></>}
          {responsable && !borrador && publicada && <form className="mt-5 flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); void ejecutar('pliego-nueva-revision', { pliego_id: pliego.id, motivo: motivo('rev') }, 'Nueva revisión en borrador.'); }}>
            <label className="grow text-sm">Motivo del cambio de alcance<input className={campo} value={motivo('rev')} onChange={(e) => setMotivos({ ...motivos, rev: e.target.value })} /></label>
            <button className={botonSuave} disabled={motivo('rev').trim().length < 3 || ocupado !== null}>Crear nueva revisión</button></form>}
        </>}
      </section>}

      {seccion === 'Planificación' && <section className={panel} data-testid="seccion-plan">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Planificación</h2>
          {(responsable || v.rol === 'coordinador') && v.plan.tareas.length > 0 && <button className={botonSuave} disabled={ocupado !== null} onClick={() => void ejecutar('plan-recalcular', {}, 'Cronograma recalculado.')}>Recalcular cronograma</button>}</div>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
          <div><dt className="text-xs text-[#718274]">Línea base</dt><dd>{v.plan.linea_base ? `v${v.plan.linea_base.version} · fin ${dia(v.plan.linea_base.fin)}` : 'sin fijar'}</dd></div>
          <div><dt className="text-xs text-[#718274]">Fin previsto</dt><dd>{dia(v.plan.fin_previsto)}</dd></div>
          <div><dt className="text-xs text-[#718274]">Atraso</dt><dd data-testid="atraso-plan">{v.plan.atraso_total_dias} días</dd></div>
          <div><dt className="text-xs text-[#718274]">Ruta crítica</dt><dd data-testid="ruta-critica">{v.plan.ruta_critica.join(' → ') || '—'}</dd></div>
        </dl>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Barra etiqueta="Avance físico" pct={v.plan.avances.avance_fisico.pct} nota={`${dinero(v.plan.avances.avance_fisico.monto)} · ${v.plan.avances.avance_fisico.fuente}`} />
          <Barra etiqueta="Certificado" pct={v.plan.avances.certificado.pct} nota={`${dinero(v.plan.avances.certificado.monto)} · ${v.plan.avances.certificado.fuente}`} />
          <Barra etiqueta="Pagado" pct={v.plan.avances.pagado.pct} nota={`${dinero(v.plan.avances.pagado.monto)} · retenido ${dinero(v.plan.avances.retenido)}`} />
        </div>
        <div className="mt-5"><CurvaS puntos={v.plan.curva_s} /></div>
        <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm">
          <thead><tr className="text-xs text-[#718274]"><th>Tarea</th><th>Partida · frente</th><th>Línea base</th><th>Plan vigente</th><th>Real</th><th>Avance</th><th>Atraso</th><th>Condiciones</th></tr></thead>
          <tbody>{v.plan.tareas.map((t: V) => <tr key={t.id} className="border-t border-[#eef2ed] align-top">
            <td className="py-2 pr-3"><strong>{t.clave}</strong> {t.titulo}{(t.proyeccion?.critica ?? t.plan.critica) && <span className="ml-2 rounded bg-red-50 px-1.5 text-xs text-red-800">crítica</span>}</td>
            <td className="pr-3">{t.partida_codigo} · {t.frente} ({numero(t.cantidad)})</td>
            <td className="pr-3 whitespace-nowrap">{t.linea_base ? `${dia(t.linea_base.inicio)} – ${dia(t.linea_base.fin)}` : '—'}</td>
            <td className="pr-3 whitespace-nowrap">{dia(t.plan.inicio)} – {dia(t.plan.fin)}</td>
            <td className="pr-3 whitespace-nowrap">{t.real.inicio ? `${dia(t.real.inicio)} – ${dia(t.real.fin)}` : '—'}</td>
            <td className="pr-3">{numero(t.avance_fisico_pct)}%</td><td className="pr-3">{t.atraso_dias} d</td>
            <td className="text-xs">{t.depende_de.map((d: V) => `tras ${d.clave}${d.lag_dias ? ` +${d.lag_dias}d` : ''}`).concat(t.restricciones.map((r: V) => r.tipo === 'recurso' ? `recurso ${r.recurso_clave}` : `${r.tipo} ${dia(r.fecha_disponible)} (${r.estado})`)).join(' · ') || '—'}
              {t.bloqueo && t.bloqueo !== 'Terminada' && <p className="text-[#8a5a00]">No habilitada: {t.bloqueo}</p>}</td></tr>)}</tbody></table></div>
      </section>}

      {seccion === 'Cotizaciones' && <section className={panel} data-testid="seccion-cotizaciones">
        <h2 className="text-xl font-semibold">Cotizaciones y contratos</h2>
        {responsable && publicada && <form className="mt-3 rounded-xl bg-[#f2f5ee] p-4" onSubmit={(e) => { e.preventDefault(); void ejecutar('solicitud-crear', { revision_id: publicada.id, paquete: solicitud.paquete, socio_ids: solicitud.socios }, 'Solicitud enviada a los contratistas.'); }}>
          <p className="text-sm font-semibold">Pedir cotización sobre la revisión {publicada.numero}</p>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
            <select aria-label="Paquete" className={`${campo} max-w-xs`} value={solicitud.paquete} onChange={(e) => setSolicitud({ ...solicitud, paquete: e.target.value })}><option value="">Elegí un paquete</option>{paquetes.map((p) => <option key={p}>{p}</option>)}</select>
            {agenda.map((s) => <label key={s.id} className="flex items-center gap-1.5"><input type="checkbox" checked={solicitud.socios.includes(s.id)} onChange={(e) => setSolicitud({ ...solicitud, socios: e.target.checked ? [...solicitud.socios, s.id] : solicitud.socios.filter((x) => x !== s.id) })} />{s.nombre}</label>)}
            <button className={boton} disabled={!solicitud.paquete || solicitud.socios.length === 0 || ocupado !== null}>Enviar solicitud</button></div>
        </form>}
        {v.solicitudes.length === 0 && <p className="mt-3 text-sm text-[#718274]">Todavía no hay solicitudes de cotización.</p>}
        {v.solicitudes.map((s: V) => <article key={s.id} className="mt-5 border-t border-[#eef2ed] pt-4" data-testid="solicitud">
          <div className="flex flex-wrap items-center gap-3"><h3 className="font-semibold">{s.titulo}</h3><Estado valor={s.estado} /><span className="text-xs text-[#718274]">revisión {s.revision_numero} · {s.invitados.length} invitados · límite {dia(s.fecha_limite)}</span></div>
          <table className="mt-2 w-full text-left text-sm"><thead><tr className="text-xs text-[#718274]"><th>Contratista</th><th>Monto</th><th>Plazo</th><th>Revisión cotizada</th><th>Estado</th><th /></tr></thead>
            <tbody>{s.ofertas.map((o: V) => <tr key={o.id} className="border-t border-[#eef2ed]"><td className="py-2">{o.contratista}</td><td>{dinero(o.monto_total)}</td><td>{o.plazo_dias} días</td>
              <td>{o.misma_revision ? 'la solicitada' : 'otra'}</td><td><Estado valor={o.estado} /></td>
              <td className="text-right">{responsable && s.estado === 'abierta' && o.estado === 'enviada' && <button className={boton} disabled={ocupado !== null} onClick={() => void ejecutar('adjudicar', { solicitud_id: s.id, oferta_id: o.id }, 'Adjudicada: las tareas del contrato quedaron publicadas.')}>Adjudicar</button>}</td></tr>)}</tbody></table>
        </article>)}
        {v.contratos.map((k: V) => <article key={k.id} className="mt-5 border-t border-[#eef2ed] pt-4" data-testid="contrato">
          <div className="flex flex-wrap items-center gap-3"><h3 className="font-semibold">Contrato · {k.contratista}</h3><Estado valor={k.estado} /><span className="text-sm">{dinero(k.monto_total)} · revisión {k.revision_numero} · retención {numero(k.retencion_pct)}%</span></div>
          <ul className="mt-2 text-sm">{k.items.map((i: V) => <li key={i.id} className="flex flex-wrap justify-between gap-2 border-b border-[#eef2ed] py-1"><span>{i.partida_codigo} · {numero(i.cantidad)} × {dinero(i.precio_unitario)}</span><span>físico {numero(i.avance_fisico_pct)}% · certificado {numero(i.certificado_pct)}% · {dinero(i.subtotal)}</span></li>)}</ul>
          {k.adendas.map((a: V) => <p key={a.id} className="mt-1 text-xs text-[#718274]">Adenda <Estado valor={a.estado} /> {dinero(a.monto_anterior)} → {dinero(a.monto_nuevo)} · {a.motivo}</p>)}
        </article>)}
      </section>}

      {seccion === 'Certificaciones' && <section className={panel} data-testid="seccion-certificaciones">
        <h2 className="text-xl font-semibold">Avances y certificados</h2>
        {v.avances.filter((a: V) => a.estado !== 'aceptado').map((a: V) => <article key={a.id} className="mt-4 rounded-xl bg-[#f2f5ee] p-4" data-testid="avance-pendiente">
          <div className="flex flex-wrap items-center gap-3"><strong>{a.tarea}: {numero(a.porcentaje)}%</strong><Estado valor={a.estado} /><span className="text-xs text-[#718274]">{dia(a.fecha)} · versión {a.version} · {a.evidencias.length} evidencia(s)</span></div>
          {a.observacion && <p className="mt-1 text-sm">Observación: {a.observacion}</p>}
          {responsable && a.estado === 'informado' && <div className="mt-3 flex flex-wrap items-end gap-3">
            <button className={boton} disabled={ocupado !== null} onClick={() => void ejecutar('avance-revisar', { avance_id: a.id, decision: 'aceptar' }, 'Avance aceptado.')}>Aceptar</button>
            <label className="grow text-sm">Qué hay que corregir<input className={campo} value={motivo(a.id)} onChange={(e) => setMotivos({ ...motivos, [a.id]: e.target.value })} /></label>
            <button className={botonSuave} disabled={ocupado !== null || motivo(a.id).trim().length < 3} onClick={() => void ejecutar('avance-revisar', { avance_id: a.id, decision: 'observar', observacion: motivo(a.id) }, 'Avance observado.')}>Observar</button></div>}
        </article>)}
        {v.certificados.length === 0 && <p className="mt-3 text-sm text-[#718274]">Todavía no hay certificados.</p>}
        {v.certificados.map((c: V) => <article key={c.id} className="mt-5 border-t border-[#eef2ed] pt-4" data-testid="certificado">
          <div className="flex flex-wrap items-center gap-3"><h3 className="font-semibold">Certificado N° {c.numero}</h3><Estado valor={c.pago ? 'pagado' : c.estado} /><span className="text-sm">bruto {dinero(c.monto_bruto)} · retención {dinero(c.retencion)} · <strong>neto {dinero(c.monto_neto)}</strong> · versión {c.version}</span></div>
          <p className="mt-1 text-sm">{c.items.map((i: V) => `${i.partida_codigo}: ${numero(i.porcentaje_anterior)}% → ${numero(i.porcentaje_acumulado)}% (${dinero(i.monto)})`).join(' · ')}</p>
          {c.motivo_rechazo && <p className="mt-1 text-sm text-red-800">Motivo de rechazo: {c.motivo_rechazo}</p>}
          <p className="mt-1 text-xs text-[#718274]">Evidencia: {c.evidencias.map((e: V) => `v${e.version} ${e.nombre}`).join(', ') || 'sin adjuntos'}</p>
          <ol className="mt-1 text-xs text-[#718274]" data-testid="historial">{c.historial.map((h: V, i: number) => <li key={i}>{dia(h.created_at)} · v{h.version} · <strong>{h.accion}</strong>{h.nota ? ` — ${h.nota}` : ''}</li>)}</ol>
          {responsable && c.estado === 'presentado' && <div className="mt-3 flex flex-wrap items-end gap-3">
            <button className={boton} disabled={ocupado !== null} onClick={() => void ejecutar('certificado-revisar', { certificado_id: c.id, decision: 'aprobar' }, 'Certificado aprobado.')}>Aprobar</button>
            <label className="grow text-sm">Motivo del rechazo<input className={campo} value={motivo(c.id)} onChange={(e) => setMotivos({ ...motivos, [c.id]: e.target.value })} /></label>
            <button className={botonSuave} disabled={ocupado !== null || motivo(c.id).trim().length < 3} onClick={() => void ejecutar('certificado-revisar', { certificado_id: c.id, decision: 'rechazar', motivo: motivo(c.id) }, 'Certificado rechazado.')}>Rechazar</button></div>}
          {responsable && c.estado === 'aprobado' && !c.pago && <button className={`${boton} mt-3`} disabled={ocupado !== null} onClick={() => void ejecutar('certificado-pagar', { certificado_id: c.id }, 'Pago registrado.')}>Pagar {dinero(c.monto_neto)}</button>}
        </article>)}
      </section>}

      {seccion === 'Financiación' && <section className={panel} data-testid="seccion-financiacion">
        <h2 className="text-xl font-semibold">Financiación <span className="text-sm font-normal text-[#718274]">({fin.moneda})</span></h2>
        <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-4">
          <div><dt className="text-xs text-[#718274]">Caja disponible</dt><dd className="text-lg font-semibold" data-testid="caja">{dinero(fin.caja.saldo)}</dd></div>
          <div><dt className="text-xs text-[#718274]">Total requerido</dt><dd className="text-lg font-semibold">{dinero(fin.necesidad.total_requerido)}</dd></div>
          <div><dt className="text-xs text-[#718274]">Necesidad de fondos</dt><dd className="text-lg font-semibold" data-testid="necesidad">{dinero(fin.necesidad.necesidad)}</dd><dd className="text-xs text-[#718274]">{fin.necesidad.primer_deficit ? `Primer déficit: ${fin.necesidad.primer_deficit}` : 'Cubierta'}</dd></div>
          <div><dt className="text-xs text-[#718274]">Cobertura con inversores</dt><dd className="text-lg font-semibold">{numero(fin.cobertura_inversora.pct)}%</dd></div>
        </dl>
        <p className="mt-2 text-xs text-[#718274]">No contado: prometido {dinero(fin.necesidad.no_contado.prometido_no_integrado)} · en custodia {dinero(fin.necesidad.no_contado.integrado_en_custodia)}. {fin.necesidad.no_contado.nota}</p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div><h3 className="text-sm font-semibold">Presupuesto</h3><ul className="text-sm">{Object.entries(fin.presupuesto_total).map(([k, val]) => <li key={k} className="flex justify-between border-b border-[#eef2ed] py-1 capitalize"><span>{k}</span><span>{dinero(val as number)}</span></li>)}</ul></div>
          <div><h3 className="text-sm font-semibold">Cronograma de pagos</h3><ul className="text-sm">{fin.necesidad.cronograma_pagos.map((m: V) => <li key={m.mes} className="flex justify-between border-b border-[#eef2ed] py-1"><span>{m.mes}</span><span>{dinero(m.pagos)} · caja {dinero(m.caja_proyectada)}</span></li>)}{fin.necesidad.cronograma_pagos.length === 0 && <li className="text-[#718274]">Sin pagos pendientes.</li>}</ul></div>
        </div>
        <h3 className="mt-5 text-sm font-semibold">Rondas MCU</h3>
        <table className="w-full text-left text-sm"><thead><tr className="text-xs text-[#718274]"><th>Ronda</th><th>Valuación previa</th><th>Precio</th><th>Ofrecidas</th><th>Integradas</th><th>Prometidas</th><th>Cierre</th><th>Estado</th><th /></tr></thead>
          <tbody>{v.rondas.map((r: V) => <tr key={r.id} className="border-t border-[#eef2ed]"><td className="py-2">{r.numero}</td><td>{dinero(r.valuacion_pre)}</td><td>{dinero(r.precio_mcu)}</td><td>{numero(r.mcu_ofrecidas)}</td><td>{numero(r.mcu_integradas)} ({dinero(r.monto_integrado)})</td><td>{numero(r.mcu_prometidas_sin_integrar)}</td><td>{dia(r.fecha_cierre)}</td><td><Estado valor={r.estado} /></td>
            <td className="text-right">{responsable && r.estado === 'abierta' && <button className={botonSuave} disabled={ocupado !== null} onClick={() => void ejecutar('ronda-cerrar', { ronda_id: r.id }, 'Ronda cerrada.')}>Cerrar ronda</button>}</td></tr>)}</tbody></table>
        {v.unidades.length > 0 && <><h3 className="mt-5 text-sm font-semibold">Imputación a unidades</h3><p className="text-xs text-[#718274]">{v.imputacion.regla} Imputado {dinero(v.imputacion.imputado)} de {dinero(v.imputacion.costo_total)}.</p>
          <table className="w-full text-left text-sm" data-testid="imputacion"><thead><tr className="text-xs text-[#718274]"><th>Unidad</th><th>m²</th><th>Coef.</th><th>Directo</th><th>Común imputado</th><th>Total</th><th>Posición vinculada</th></tr></thead>
            <tbody>{v.imputacion.unidades.map((u: V) => <tr key={u.unidad} className="border-t border-[#eef2ed]"><td className="py-1.5">{u.unidad}</td><td>{numero(u.m2)}</td><td>{numero(u.coeficiente_pct)}%</td><td>{dinero(u.costo_directo)}</td><td>{dinero(u.costo_comun_imputado)}</td><td>{dinero(u.costo_total)}</td><td>{u.posicion_vinculada ? `${numero(u.posicion_vinculada.mcu)} MCU · ${numero(u.posicion_vinculada.participacion_resultado_pct)}% del resultado` : '—'}</td></tr>)}</tbody></table></>}
      </section>}
    </div>
  );
}
