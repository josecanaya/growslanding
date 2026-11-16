-- Lectura de control (solo evidencia): qué quedó persistido en la instancia de pruebas.
\pset border 1
\echo '== Obras simuladas'
select o.id as obra, o.name, c.estado from obras o left join obra_circuito c on c.obra_id = o.id where o.name like '[SIM]%' order by o.created_at;
\echo '== Certificados y pagos (un pago por certificado)'
select o.name as obra, ce.id as certificado, ce.numero, ce.estado, ce.version, ce.monto_neto, count(p.id) as pagos, min(p.id::text) as pago
from certificados ce join obras o on o.id = ce.obra_id left join pagos_obra p on p.certificado_id = ce.id group by o.name, ce.id order by o.name, ce.created_at;
\echo '== Movimientos de caja por pago de certificado (debe haber uno por certificado pagado)'
select ref_id as certificado, count(*) as movimientos, sum(monto) as monto from caja_movimientos where tipo = 'pago_certificado' group by ref_id having count(*) <> 1;
\echo '== Contratos por solicitud (una adjudicación por solicitud)'
select o.name as obra, s.paquete, s.estado, count(k.id) as contratos, count(*) filter (where f.estado = 'adjudicada') as ofertas_adjudicadas
from solicitudes_cotizacion s join obras o on o.id = s.obra_id left join contratos k on k.solicitud_id = s.id left join ofertas f on f.solicitud_id = s.id group by o.name, s.id order by o.name, s.created_at;
\echo '== Claves de idempotencia de pagos de certificado'
select i.clave, i.resultado->>'pago_id' as pago, i.resultado->>'ya_pagado' as ya_pagado, i.created_at from circuito_idempotencia i where i.accion = 'pago_certificado' and i.clave like 'sim:vivienda:%cert.obra-gruesa.1%' order by i.created_at;
\echo '== Rondas'
select o.name as obra, r.numero, r.estado, r.precio_mcu, r.mcu_ofrecidas, r.umbral_mcu,
  (select coalesce(sum(mcu),0) from mcu_suscripciones s where s.ronda_id = r.id and s.estado = 'asignada') as asignadas,
  (select coalesce(sum(mcu),0) from mcu_suscripciones s where s.ronda_id = r.id and s.estado = 'devuelta') as devueltas,
  (select coalesce(sum(mcu),0) from mcu_suscripciones s where s.ronda_id = r.id and s.estado = 'cancelada') as prometidas_canceladas
from mcu_rondas r join obras o on o.id = r.obra_id order by o.name, r.numero;
\echo '== Caja por obra'
select o.name as obra, coalesce(sum(m.monto),0) as caja, coalesce(sum(m.monto) filter (where m.tipo='aporte_ronda'),0) as aportes from obras o left join caja_movimientos m on m.obra_id = o.id where o.name like '[SIM]%' group by o.name order by o.name;
\echo '== Posiciones MCU'
select o.name as obra, u.email, p.id as posicion, p.cantidad, p.costo_total, un.codigo as unidad from mcu_posiciones p join obras o on o.id = p.obra_id join auth.users u on u.id = p.user_id left join obra_unidades un on un.id = p.unidad_id order by o.name, u.email;
\echo '== Evidencias en Storage vs registradas'
select (select count(*) from evidencias_obra) as registradas, (select count(*) from storage.objects where bucket_id = 'evidencias-obra') as objetos_en_storage;
