// Preparación (por API) de una obra chica para la verificación en navegador. Deja pendientes las acciones
// que después se hacen con clics reales: suscribir, cotizar, adjudicar, cerrar ronda, informar, certificar, rechazar, corregir, aprobar y pagar.
import { exito } from '../motor.mjs';
import { alta, paso, plan, pliego } from './comunes.mjs';

const PARTIDAS = [{ codigo: 'N-01', paquete: 'estructura', titulo: 'Platea de fundación', alcance: 'Platea de HºAº H-25 de 20 cm con doble malla según plano E-01.', cantidad: 20, unidad: 'm3',
  fuente: 'Plano E-01', fuente_revision: 'A', evidencia_requerida: 'Fotos fechadas de armaduras y remitos de hormigón.', criterio_aceptacion: 'Niveles ±1 cm y recubrimientos según plano.',
  responsable: 'Contratista de estructura', precio_referencia: 500, orden: 1 }];
export default {
  clave: 'navegador', nombre: 'Obra para verificación en navegador', inicio: new Date().toISOString().slice(0, 10),
  pasos: () => [
    ...alta({ nombre: 'Casa Navegador', direccion: 'Calle de Prueba 100, Rosario', localidad: 'Rosario', tipo: 'vivienda', resumen: 'Obra mínima para verificar los recorridos en navegador. Datos ficticios.' }),
    ...pliego({ titulo: 'Pliego de platea', partidas: PARTIDAS }, 0),
    ...plan({ tareas: [{ clave: 'N-PLAT', titulo: 'Platea', partida_codigo: 'N-01', frente: 'planta baja', cantidad: 20, duracion_dias: 5, etapa: 'Estructura' }], diaInicio: 0 }, 0),
    paso('prep.ronda', 0, 'arquitecto', 'Abrir una ronda y dejarla casi integrada', async (c) => {
      const r = exito(await c.s.arquitecto.accion(c.v.obra, 'ronda-crear', { simbolo: 'NAVE', valuacion_pre: 0, precio_mcu: 100, mcu_ofrecidas: 300, minimo_mcu: 10, umbral_mcu: 200,
        fecha_apertura: c.fecha(0), fecha_cierre: c.fecha(10), destino_fondos: [{ concepto: 'Platea de fundación', monto: 10000 }, { concepto: 'Reserva de ensayo', monto: 20000 }],
        que_se_compra: 'MCU de la obra Casa Navegador: fracción del resultado del proyecto.', condiciones_salida: 'Sin salida garantizada; solo por transferencia a otro inversor.' }, c.idem));
      exito(await c.s.arquitecto.accion(c.v.obra, 'ronda-abrir', { ronda_id: r.ronda_id }, c.idem + ':abrir'));
      const s = exito(await c.s.inversor2.accion(c.v.obra, 'suscribir', { ronda_id: r.ronda_id, mcu: 250 }, c.idem + ':s'));
      exito(await c.s.inversor2.accion(c.v.obra, 'suscripcion-integrar', { suscripcion_id: s.suscripcion_id }, c.idem + ':i'));
      c.v.ronda = r.ronda_id;
      return { id: r.ronda_id };
    }),
    paso('prep.solicitud', 0, 'arquitecto', 'Pedir cotización y recibir dos ofertas por API', async (c) => {
      const s = exito(await c.s.arquitecto.accion(c.v.obra, 'solicitud-crear', { revision_id: c.v.rev1, paquete: 'estructura', socio_ids: ['contratista1', 'contratista2', 'contratista3'].map((k) => c.s[k].identidad.socio_id) }, c.idem));
      for (const [k, precio] of [['contratista1', 480], ['contratista2', 515]]) {
        exito(await c.s[k].accion(c.v.obra, 'oferta-enviar', { solicitud_id: s.solicitud_id, revision_id: c.v.rev1, items: [{ partida_codigo: 'N-01', precio_unitario: precio }], plazo_dias: 12 }, `${c.idem}:${k}`));
      }
      c.v.solicitud = s.solicitud_id;
      return { id: s.solicitud_id };
    }),
  ],
};
