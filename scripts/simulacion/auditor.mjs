// Auditor: relee lo persistido por las APIs normales, con la sesión de CADA rol, y contrasta que
// todos vean los mismos hechos y que las invariantes del circuito se cumplan. No usa acceso administrativo.
import { exito } from './motor.mjs';

const r2 = (n) => Math.round(n * 100) / 100;
const suma = (xs, f) => r2(xs.reduce((s, x) => s + f(x), 0));
const cerca = (a, b) => Math.abs(a - b) < 0.005;

export async function auditarObra(c) {
  const controles = [];
  const control = (nombre, ok, detalle) => controles.push({ nombre, ok: Boolean(ok), detalle });
  const obra = c.v.obra;
  // 1) Lectura con el rol de auditor (solo lectura) y con el responsable: deben coincidir.
  const aud = exito(await c.s.auditor.get(`/api/obras/${obra}/circuito`), 'vista del auditor');
  const arq = exito(await c.s.arquitecto.get(`/api/obras/${obra}/circuito`), 'vista del responsable');
  control('auditor entra con rol propio de solo lectura', aud.rol === 'auditor', aud.rol);
  control('auditor y responsable leen los mismos certificados', JSON.stringify(aud.certificados) === JSON.stringify(arq.certificados), `${aud.certificados.length} certificados`);
  const escritura = await c.s.auditor.accion(obra, 'reserva-ajustar', { monto: 1, motivo: 'intento del auditor' });
  control('el auditor no puede escribir', escritura.status === 403, `status ${escritura.status}`);

  // 2) Pliego y contratos
  const publicadas = aud.pliegos.flatMap((p) => p.revisiones).filter((r) => r.estado === 'publicada');
  control('una sola revisión publicada por pliego', publicadas.length <= aud.pliegos.length, `${publicadas.length}`);
  const incompletas = publicadas.flatMap((r) => r.partidas).filter((p) => !(p.alcance && p.cantidad > 0 && p.unidad && p.fuente && p.fuente_revision && p.evidencia_requerida && p.criterio_aceptacion && p.responsable));
  control('toda partida publicada tiene alcance, cantidad, unidad, fuente y revisión, evidencia, criterio y responsable', incompletas.length === 0, incompletas.map((p) => p.codigo).join(',') || 'completas');
  for (const s of aud.solicitudes) {
    const adjudicadas = s.ofertas.filter((o) => o.estado === 'adjudicada');
    const contratos = aud.contratos.filter((k) => k.solicitud_id === s.id);
    control(`solicitud ${s.paquete} (rev ${s.revision_numero}): una sola adjudicación y un solo contrato`, adjudicadas.length <= 1 && contratos.length === adjudicadas.length, `${adjudicadas.length} adjudicada(s), ${contratos.length} contrato(s)`);
    control(`solicitud ${s.paquete} (rev ${s.revision_numero}): toda oferta quedó ligada a la revisión recibida`, s.ofertas.every((o) => o.misma_revision), `${s.ofertas.length} ofertas`);
  }
  const codigos = aud.contratos.flatMap((k) => k.items.map((i) => i.partida_codigo));
  control('ninguna partida está contratada dos veces', new Set(codigos).size === codigos.length, `${codigos.length} ítems contratados`);

  // 3) Avance físico ≥ certificado ≥ pagado, y un pago por certificado
  for (const k of aud.contratos) {
    for (const i of k.items) control(`contrato ${k.contratista} · ${i.partida_codigo}: certificado ≤ avance físico aceptado`, i.certificado_pct <= i.avance_fisico_pct + 0.001 && i.certificado_monto <= i.subtotal + 0.005, `${i.certificado_pct}% ≤ ${i.avance_fisico_pct}%`);
  }
  const aprobados = aud.certificados.filter((x) => x.estado === 'aprobado');
  control('solo certificados aprobados tienen pago', aud.certificados.every((x) => !x.pago || x.estado === 'aprobado'), `${aud.certificados.filter((x) => x.pago).length} pagos`);
  control('cada pago coincide con el neto de su certificado', aprobados.every((x) => !x.pago || cerca(x.pago.monto, x.monto_neto)), '');
  const pagosCaja = aud.financiacion.caja.movimientos.filter((m) => m.tipo === 'pago_certificado');
  control('un certificado genera como máximo un pago (caja)', new Set(pagosCaja.map((m) => m.ref_id)).size === pagosCaja.length && pagosCaja.length === aud.certificados.filter((x) => x.pago).length, `${pagosCaja.length} movimientos de pago`);
  const av = aud.plan.avances;
  control('avance físico, certificado y pagado se informan por separado', av.avance_fisico && av.certificado && av.pagado && av.pagado.monto <= av.certificado.monto + 0.005, `físico ${av.avance_fisico.pct}% · certificado ${av.certificado.pct}% · pagado ${av.pagado.pct}%`);
  control('aceptar un avance exige evidencia', aud.avances.filter((a) => a.estado === 'aceptado').every((a) => a.evidencias.some((e) => e.version === a.version)), `${aud.avances.length} avances`);
  control('aprobar un certificado exige evidencia de su versión', aprobados.every((x) => x.evidencias.some((e) => e.version === x.version)), `${aprobados.length} aprobados`);

  // 4) Lo que ve cada contratista: solo lo suyo y con los mismos números
  let cobradoContratistas = 0;
  for (const k of ['contratista1', 'contratista2', 'contratista3']) {
    const todo = exito(await c.s[k].get('/api/socio/circuito'), `trabajo de ${k}`);
    const o = todo.obras.find((x) => x.obra.id === obra);
    if (!o) { control(`${k}: sin trabajo en la obra`, !aud.contratos.some((x) => x.socio_id === c.s[k].identidad.socio_id), 'sin invitaciones'); continue; }
    const texto = JSON.stringify(o);
    const ajenos = ['contratista1', 'contratista2', 'contratista3'].filter((x) => x !== k).map((x) => c.s[x].identidad.socio_id);
    control(`${k}: no ve ofertas ni contratos de otros contratistas`, !ajenos.some((id) => texto.includes(id)) && !('ofertas' in (o.solicitudes[0] ?? {})) && !texto.includes('precio_referencia'), `${o.solicitudes.length} solicitudes, ${o.contratos.length} contratos`);
    for (const cert of o.certificados) {
      const ref = aud.certificados.find((x) => x.id === cert.id);
      control(`${k}: ve el certificado ${cert.numero} igual que el responsable`, ref && ref.estado === cert.estado && cerca(ref.monto_neto, cert.monto_neto) && ref.version === cert.version, `${cert.estado} v${cert.version}`);
    }
    cobradoContratistas = r2(cobradoContratistas + o.cobrado);
  }
  control('lo cobrado por los contratistas = lo pagado por la obra', cerca(cobradoContratistas, av.pagado.monto), `${cobradoContratistas} = ${av.pagado.monto}`);

  // 5) Caja: solo dinero integrado en rondas cerradas con éxito
  const caja = aud.financiacion.caja;
  control('saldo de caja = suma de sus movimientos', cerca(caja.saldo, suma(caja.movimientos, (m) => m.monto)), `${caja.saldo}`);
  const exitosas = aud.rondas.filter((r) => r.estado === 'cerrada_exitosa');
  control('aportes en caja = integrado en rondas cerradas con éxito', cerca(caja.aportado_por_rondas, suma(exitosas, (r) => r.monto_integrado)), `${caja.aportado_por_rondas}`);
  control('rondas fallidas o abiertas no aportaron caja', caja.movimientos.filter((m) => m.tipo === 'aporte_ronda').every((m) => exitosas.some((r) => r.id === m.ref_id)), `${aud.rondas.length} rondas`);
  control('caja nunca negativa', caja.saldo >= -0.005, `${caja.saldo}`);
  control('lo prometido se informa aparte y no reduce la necesidad', 'prometido_no_integrado' in aud.financiacion.necesidad.no_contado, `prometido ${aud.financiacion.necesidad.no_contado.prometido_no_integrado}`);

  // 6) Inversores: posiciones, feed y fondos
  let mcuInversores = 0; let fichaPublica = null;
  const pub = await c.s.inversor1.get(`/api/inversion/obras/${obra}`, { anonimo: true });
  if (pub.status === 200) fichaPublica = pub.cuerpo;
  control('la ficha pública existe y no expone posiciones personales', fichaPublica && fichaPublica.mi_posicion === null, `status ${pub.status}`);
  for (const k of ['inversor1', 'inversor2', 'inversor3']) {
    const f = exito(await c.s[k].get(`/api/inversion/obras/${obra}`), `ficha de ${k}`);
    const cuenta = exito(await c.s[k].get('/api/inversion/posicion'), `cuenta de ${k}`);
    mcuInversores += f.mi_posicion.mcu;
    control(`${k}: saldo = suma de movimientos y no negativo`, cerca(cuenta.fondos.saldo_disponible, suma(cuenta.movimientos, (m) => m.monto)) && cuenta.fondos.saldo_disponible >= 0, `${cuenta.fondos.saldo_disponible}`);
    const hist = suma(f.mi_posicion.historial, (h) => h.cantidad);
    control(`${k}: posición = suma de su historial de MCU`, hist === f.mi_posicion.mcu, `${f.mi_posicion.mcu} MCU`);
    control(`${k}: ve el mismo avance verificado que el responsable`, cerca(f.avance_verificado.fisico_pct, av.avance_fisico.pct) && cerca(f.avance_verificado.certificado_pct, av.certificado.pct) && cerca(f.avance_verificado.pagado_pct, av.pagado.pct), `físico ${f.avance_verificado.fisico_pct}%`);
    control(`${k}: ve la misma caja y estado de obra que el responsable`, cerca(f.fondos_obra.caja, caja.saldo) && f.obra.estado === aud.obra.estado, `${f.fondos_obra.caja} · ${f.obra.estado}`);
  }
  const emitidas = fichaPublica?.mcu_emitidas ?? 0;
  control('MCU emitidas = suma de posiciones de los inversores', mcuInversores === emitidas, `${mcuInversores} = ${emitidas}`);
  control('MCU emitidas = MCU asignadas en rondas exitosas', emitidas === exitosas.reduce((s, r) => s + r.mcu_integradas, 0), `${emitidas}`);

  // 7) Unidades: imputación sin duplicar
  if (aud.unidades.length) {
    control('la imputación a unidades suma exactamente el costo total', aud.imputacion.cierra, `${aud.imputacion.imputado} de ${aud.imputacion.costo_total}`);
    control('cada partida común figura una vez y en un solo contrato', aud.imputacion.control.partidas_duplicadas.length === 0 && aud.imputacion.control.contratos_por_partida_comun.every((x) => x.contratos <= 1), `${aud.imputacion.partidas_comunes.length} comunes`);
    const vinculadas = aud.imputacion.unidades.filter((u) => u.posicion_vinculada).map((u) => u.posicion_vinculada.posicion_id);
    control('una posición se vincula a una sola unidad', new Set(vinculadas).size === vinculadas.length, `${vinculadas.length} vínculos`);
  }
  // 8) Acceso directo a la base con el token de un usuario común: RLS lo impide
  const directo = await c.s.contratista1.restDirecto('GET', 'pagos_obra?select=id');
  control('un usuario no puede leer las tablas del circuito salteando la API', directo.status === 401 || directo.status === 403, `status ${directo.status}`);

  const fallas = controles.filter((x) => !x.ok).map((x) => `${x.nombre} (${x.detalle})`);
  return { controles, fallas, resumen: { contratos: aud.contratos.length, certificados: aud.certificados.length, pagos: pagosCaja.length, caja: caja.saldo, mcu_emitidas: emitidas,
    avance: { fisico_pct: av.avance_fisico.pct, certificado_pct: av.certificado.pct, pagado_pct: av.pagado.pct }, estado_obra: aud.obra.estado } };
}
