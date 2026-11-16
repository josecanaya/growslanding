# Verificación en navegador

- Generado: 2026-11-16T10:36:02.050Z
- Versión: `e1e57cd`
- Instancia: http://127.0.0.1:3100 (build de producción, middleware de autenticación activo)
- Obra: `61624538-d6b0-4b10-94e5-543c4597a0e2`
- Resultado: **aprobado** (30/30)

| # | Actor | Paso | Resultado | Captura | Detalle |
|---|---|---|---|---|---|
| 01 | anonimo | Feed público muestra la obra y la ficha de inversión sin sesión | ✅ | [01-anonimo-feed-pu-blico-muestra-la-obra-y-la-ficha-de-invers.png](01-anonimo-feed-pu-blico-muestra-la-obra-y-la-ficha-de-invers.png) | `{"aporte_minimo":"USD 1.000,00"}` |
| 02 | anonimo | Circuito interno de la obra exige sesión | ✅ | [02-anonimo-circuito-interno-de-la-obra-exige-sesio-n.png](02-anonimo-circuito-interno-de-la-obra-exige-sesio-n.png) | `{"destino":"/auth/login"}` |
| 03 | inversor1 | Iniciar sesión por el formulario | ✅ | [03-inversor1-iniciar-sesio-n-por-el-formulario.png](03-inversor1-iniciar-sesio-n-por-el-formulario.png) | `{"destino":"/inversores"}` |
| 04 | inversor1 | Entrar por el feed y suscribir 20 MCU | ✅ | [04-inversor1-entrar-por-el-feed-y-suscribir-20-mcu.png](04-inversor1-entrar-por-el-feed-y-suscribir-20-mcu.png) | `{"monto":"USD 2.000,00 · 6,67% si se completa"}` |
| 05 | inversor1 | Integrar la suscripción | ✅ | [05-inversor1-integrar-la-suscripcio-n.png](05-inversor1-integrar-la-suscripcio-n.png) |  |
| 06 | inversor1 | Mi posición muestra el estado de los fondos | ✅ | [06-inversor1-mi-posicio-n-muestra-el-estado-de-los-fondos.png](06-inversor1-mi-posicio-n-muestra-el-estado-de-los-fondos.png) | `{"saldo":"USD 693.057,68"}` |
| 07 | inversor1 | El inversor no accede al circuito interno | ✅ | [07-inversor1-el-inversor-no-accede-al-circuito-interno.png](07-inversor1-el-inversor-no-accede-al-circuito-interno.png) |  |
| 08 | contratista3 | Iniciar sesión por el formulario | ✅ | [08-contratista3-iniciar-sesio-n-por-el-formulario.png](08-contratista3-iniciar-sesio-n-por-el-formulario.png) | `{"destino":"/socio"}` |
| 09 | contratista3 | Ver el alcance recibido y enviar oferta | ✅ | [09-contratista3-ver-el-alcance-recibido-y-enviar-oferta.png](09-contratista3-ver-el-alcance-recibido-y-enviar-oferta.png) |  |
| 10 | arquitecto | Iniciar sesión por el formulario | ✅ | [10-arquitecto-iniciar-sesio-n-por-el-formulario.png](10-arquitecto-iniciar-sesio-n-por-el-formulario.png) | `{"destino":"/cliente/dashboard"}` |
| 11 | arquitecto | Pliego publicado con todos los campos por partida | ✅ | [11-arquitecto-pliego-publicado-con-todos-los-campos-por-partida.png](11-arquitecto-pliego-publicado-con-todos-los-campos-por-partida.png) |  |
| 12 | arquitecto | Planificación: línea base, ruta crítica y curva S | ✅ | [12-arquitecto-planificacio-n-li-nea-base-ruta-cri-tica-y-curva-s.png](12-arquitecto-planificacio-n-li-nea-base-ruta-cri-tica-y-curva-s.png) | `{"ruta_critica":"N-PLAT"}` |
| 13 | arquitecto | Comparar tres ofertas y adjudicar | ✅ | [13-arquitecto-comparar-tres-ofertas-y-adjudicar.png](13-arquitecto-comparar-tres-ofertas-y-adjudicar.png) |  |
| 14 | arquitecto | Cerrar la ronda y ver la caja | ✅ | [14-arquitecto-cerrar-la-ronda-y-ver-la-caja.png](14-arquitecto-cerrar-la-ronda-y-ver-la-caja.png) | `{"caja":"USD 0,00"}` |
| 15 | contratista1 | Iniciar sesión por el formulario | ✅ | [15-contratista1-iniciar-sesio-n-por-el-formulario.png](15-contratista1-iniciar-sesio-n-por-el-formulario.png) | `{"destino":"/socio"}` |
| 16 | contratista1 | Informar avance de la tarea habilitada con evidencia | ✅ | [16-contratista1-informar-avance-de-la-tarea-habilitada-con-evidenc.png](16-contratista1-informar-avance-de-la-tarea-habilitada-con-evidenc.png) |  |
| 17 | arquitecto | Iniciar sesión por el formulario | ✅ | [17-arquitecto-iniciar-sesio-n-por-el-formulario.png](17-arquitecto-iniciar-sesio-n-por-el-formulario.png) | `{"destino":"/cliente/dashboard"}` |
| 18 | arquitecto | Aceptar el avance con evidencia | ✅ | [18-arquitecto-aceptar-el-avance-con-evidencia.png](18-arquitecto-aceptar-el-avance-con-evidencia.png) |  |
| 19 | contratista1 | Iniciar sesión por el formulario | ✅ | [19-contratista1-iniciar-sesio-n-por-el-formulario.png](19-contratista1-iniciar-sesio-n-por-el-formulario.png) | `{"destino":"/socio"}` |
| 20 | contratista1 | Presentar el certificado con evidencia | ✅ | [20-contratista1-presentar-el-certificado-con-evidencia.png](20-contratista1-presentar-el-certificado-con-evidencia.png) |  |
| 21 | arquitecto | Iniciar sesión por el formulario | ✅ | [21-arquitecto-iniciar-sesio-n-por-el-formulario.png](21-arquitecto-iniciar-sesio-n-por-el-formulario.png) | `{"destino":"/cliente/dashboard"}` |
| 22 | arquitecto | Rechazar el certificado con motivo | ✅ | [22-arquitecto-rechazar-el-certificado-con-motivo.png](22-arquitecto-rechazar-el-certificado-con-motivo.png) |  |
| 23 | contratista1 | Iniciar sesión por el formulario | ✅ | [23-contratista1-iniciar-sesio-n-por-el-formulario.png](23-contratista1-iniciar-sesio-n-por-el-formulario.png) | `{"destino":"/socio"}` |
| 24 | contratista1 | Corregir la observación y volver a presentar | ✅ | [24-contratista1-corregir-la-observacio-n-y-volver-a-presentar.png](24-contratista1-corregir-la-observacio-n-y-volver-a-presentar.png) |  |
| 25 | arquitecto | Iniciar sesión por el formulario | ✅ | [25-arquitecto-iniciar-sesio-n-por-el-formulario.png](25-arquitecto-iniciar-sesio-n-por-el-formulario.png) | `{"destino":"/cliente/dashboard"}` |
| 26 | arquitecto | Aprobar y pagar el certificado corregido | ✅ | [26-arquitecto-aprobar-y-pagar-el-certificado-corregido.png](26-arquitecto-aprobar-y-pagar-el-certificado-corregido.png) | `{"historial":["presentado","rechazado — El acta no está firmada.","corregido","aprobado","pagado"]}` |
| 27 | auditor | Iniciar sesión por el formulario | ✅ | [27-auditor-iniciar-sesio-n-por-el-formulario.png](27-auditor-iniciar-sesio-n-por-el-formulario.png) | `{"destino":"/obras/61624538-d6b0-4b10-94e5-543c4597a0e2/circuito"}` |
| 28 | auditor | El auditor relee el circuito en solo lectura | ✅ | [28-auditor-el-auditor-relee-el-circuito-en-solo-lectura.png](28-auditor-el-auditor-relee-el-circuito-en-solo-lectura.png) |  |
| 29 | inversor1 | Iniciar sesión por el formulario | ✅ | [29-inversor1-iniciar-sesio-n-por-el-formulario.png](29-inversor1-iniciar-sesio-n-por-el-formulario.png) | `{"destino":"/inversores"}` |
| 30 | inversor1 | El inversor ve el avance verificado y su posición asignada | ✅ | [30-inversor1-el-inversor-ve-el-avance-verificado-y-su-posicio-n.png](30-inversor1-el-inversor-ve-el-avance-verificado-y-su-posicio-n.png) | `{"mcu":"20"}` |
