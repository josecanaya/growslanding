# Corrida corrida-1

- Generado: 2026-11-16T10:35:31.528Z
- Versión del código: `e1e57cd`
- Semilla: —
- Instancia: —
- Tiempo simulado hasta el día: —

| Escenario | Obra | Ejecutados en esta corrida | Retomados | ✅ aprobado | ❌ fallido | ⛔ bloqueado | ⬜ no probado | Completo |
|---|---|---|---|---|---|---|---|---|
| Vivienda unifamiliar · recorrido normal | `74639fc2-6811-4150-96ef-22fbac69af7b` | 58 | 0 | 58 | 0 | 0 | 23 | no |
| Edificio por etapas · estructura y paquetes comunes | `e168d16b-a561-4b68-9e27-e4f1c567b7ff` | 44 | 0 | 44 | 0 | 0 | 68 | no |
| Obra con fallas combinadas | `6ce8365b-df51-4b24-9b6c-94487bf5dd72` | 40 | 0 | 40 | 0 | 0 | 46 | no |

Los conteos por resultado son **acumulados** del recorrido (todas las corridas); «no probado» son pasos que todavía no se ejecutaron.
Tipos de paso: `producto` = acción normal de un rol · `permiso`, `validacion`, `concurrencia`, `idempotencia`, `recuperacion` = pruebas que esperan un rechazo o un comportamiento · `auditoria` = relectura de lo persistido.

## Vivienda unifamiliar · recorrido normal

Obra `74639fc2-6811-4150-96ef-22fbac69af7b` · semilla 20261116 · corridas: corrida-1

| | Día | Actor | Acción | Tipo | ID del registro | Corrida |
|---|---|---|---|---|---|---|
| ✅ | 0 | arquitecto | Crear la obra | producto | `74639fc2-6811-4150-96ef-22fbac69af7b` | corrida-1 ● |
| ✅ | 0 | arquitecto | Agendar a contratista1 | producto | `ac019c0c-8729-4cf1-be27-f73c470c649d` | corrida-1 ● |
| ✅ | 0 | arquitecto | Agendar a contratista2 | producto | `805b00e6-8cd7-495c-b2ea-ab9f99a9b586` | corrida-1 ● |
| ✅ | 0 | arquitecto | Agendar a contratista3 | producto | `46e4e03f-2730-4116-b0a2-b3e15eb18b17` | corrida-1 ● |
| ✅ | 0 | arquitecto | Sumar coordinador a la obra | producto | `81628228-a3f9-4131-86b3-d78607e0bd94` | corrida-1 ● |
| ✅ | 0 | arquitecto | Sumar auditor a la obra | producto | `54693e78-8c27-46c1-a890-3f2d02beb14b` | corrida-1 ● |
| ✅ | 0 | arquitecto | Publicar la obra en el feed | producto | `74639fc2-6811-4150-96ef-22fbac69af7b` | corrida-1 ● |
| ✅ | 0 | inversor1 | Un inversor intenta leer el circuito interno de la obra → 403 | permiso | — | corrida-1 ● |
| ✅ | 1 | arquitecto | Crear pliego (ingeniería general) | producto | `2af68005-04ea-4b4b-85de-9c03442e08ad` | corrida-1 ● |
| ✅ | 1 | arquitecto | Cargar 3 partidas con alcance general | producto | `7da7d450-d6fe-44cd-a048-761405b20d44` | corrida-1 ● |
| ✅ | 1 | contratista1 | Un contratista intenta editar el pliego → 403 | permiso | — | corrida-1 ● |
| ✅ | 1 | arquitecto | Pasar a ingeniería de detalle | producto | `7da7d450-d6fe-44cd-a048-761405b20d44` | corrida-1 ● |
| ✅ | 1 | arquitecto | Intentar publicar sin cantidad, fuente, evidencia, criterio ni responsable → 422 | validacion | — | corrida-1 ● |
| ✅ | 1 | arquitecto | Completar cantidad, unidad, fuente y revisión, evidencia, criterio y responsable | producto | `7da7d450-d6fe-44cd-a048-761405b20d44` | corrida-1 ● |
| ✅ | 1 | arquitecto | Publicar el pliego (revisión 1) | producto | `7da7d450-d6fe-44cd-a048-761405b20d44` | corrida-1 ● |
| ✅ | 2 | coordinador | Planificar 3 tareas vinculadas a partidas | producto | `74639fc2-6811-4150-96ef-22fbac69af7b` | corrida-1 ● |
| ✅ | 2 | contratista2 | Un contratista intenta cambiar el plan → 403 | permiso | — | corrida-1 ● |
| ✅ | 2 | coordinador | Intentar repartir más cantidad que la partida → 422 | validacion | — | corrida-1 ● |
| ✅ | 2 | arquitecto | Calcular cronograma y fijar línea base | producto | `e916f310-2876-47ca-8d2e-2aabc69df6b9` | corrida-1 ● |
| ✅ | 3 | arquitecto | Registrar terreno, honorarios y reserva | producto | `294f2230-20c3-4d40-b80d-e6e16a5a56ee` | corrida-1 ● |
| ✅ | 3 | arquitecto | Calcular la necesidad de fondos y crear la ronda 1 por el 100% | producto | `b4a43af1-d171-4395-80f5-185c630c8110` | corrida-1 ● |
| ✅ | 3 | arquitecto | El responsable intenta suscribir su propia ronda → 403 | permiso | — | corrida-1 ● |
| ✅ | 3 | arquitecto | Pedir cotización de «obra-gruesa» a tres contratistas | producto | `076d292c-704e-45dc-8981-3492f8062aab` | corrida-1 ● |
| ✅ | 4 | contratista1 | Cotizar la revisión recibida de «obra-gruesa» | producto | `adf549e4-c756-4560-b0e2-ecc487f2b98e` | corrida-1 ● |
| ✅ | 4 | inversor1 | Suscribir por debajo del aporte mínimo → 422 | validacion | — | corrida-1 ● |
| ✅ | 4 | inversor1 | Entrar por el feed y suscribir 700 MCU | producto | `24b8a206-1534-40b8-82a6-1f96120c3f98` | corrida-1 ● |
| ✅ | 4 | inversor2 | Entrar por el feed y suscribir 470 MCU | producto | `8ea58dc2-6201-4560-bf48-da23e7fbb7a9` | corrida-1 ● |
| ✅ | 4 | inversor3 | Suscribir el resto de la ronda | producto | `cdca2e52-5614-43f0-bf3c-78c5f9515a01` | corrida-1 ● |
| ✅ | 5 | contratista2 | Cotizar la revisión recibida de «obra-gruesa» | producto | `737fa178-3d6d-46e6-8de4-91b122930453` | corrida-1 ● |
| ✅ | 5 | inversor1 | Integrar la suscripción (dinero ficticio a custodia de la ronda) | producto | `24b8a206-1534-40b8-82a6-1f96120c3f98` | corrida-1 ● |
| ✅ | 5 | inversor2 | Integrar la suscripción (dinero ficticio a custodia de la ronda) | producto | `8ea58dc2-6201-4560-bf48-da23e7fbb7a9` | corrida-1 ● |
| ✅ | 5 | arquitecto | Con una suscripción prometida sin integrar, la caja y la necesidad no cambian | producto | `b4a43af1-d171-4395-80f5-185c630c8110` | corrida-1 ● |
| ✅ | 5 | arquitecto | Pagar el terreno antes de cerrar la ronda → 409 fondos insuficientes | validacion | — | corrida-1 ● |
| ✅ | 5 | inversor3 | Integrar la suscripción | producto | `cdca2e52-5614-43f0-bf3c-78c5f9515a01` | corrida-1 ● |
| ✅ | 5 | inversor2 | Integrar por encima del cupo de la ronda → 409 | validacion | `d0928847-4950-4686-9043-37d1a79295f5` | corrida-1 ● |
| ✅ | 6 | contratista3 | Cotizar la revisión recibida de «obra-gruesa» | producto | `0eae3341-59d5-452e-9336-b0d64a51f9e4` | corrida-1 ● |
| ✅ | 6 | arquitecto | Cerrar la ronda 1: lo integrado pasa a caja de obra | producto | `b4a43af1-d171-4395-80f5-185c630c8110` | corrida-1 ● |
| ✅ | 7 | arquitecto | Comparar las tres ofertas sobre la misma revisión | producto | `076d292c-704e-45dc-8981-3492f8062aab` | corrida-1 ● |
| ✅ | 7 | coordinador | El coordinador intenta adjudicar → 403 | permiso | — | corrida-1 ● |
| ✅ | 7 | arquitecto | Pagar el terreno desde la caja de obra | producto | `294f2230-20c3-4d40-b80d-e6e16a5a56ee` | corrida-1 ● |
| ✅ | 7 | arquitecto | Dos adjudicaciones simultáneas sobre la misma solicitud: gana una sola | concurrencia | `db3cbc1e-4d46-4856-b0f5-bc9e79c1da09` | corrida-1 ● |
| ✅ | 7 | arquitecto | Reintentar la adjudicación ganadora con la misma clave: mismo contrato, sin duplicar | idempotencia | `db3cbc1e-4d46-4856-b0f5-bc9e79c1da09` | corrida-1 ● |
| ✅ | 7 | arquitecto | Las tareas del contrato quedan publicadas para el contratista | producto | `db3cbc1e-4d46-4856-b0f5-bc9e79c1da09` | corrida-1 ● |
| ✅ | 12 | contratista1 | Un contratista no adjudicado intenta informar avance → 403 | permiso | — | corrida-1 ● |
| ✅ | 12 | contratista2 | Informar avance de una tarea con predecesoras sin terminar → 409 | validacion | — | corrida-1 ● |
| ✅ | 12 | contratista2 | Informar 50% de V-FUND con evidencia | producto | `e1df2017-8fb7-467f-8038-39d19bf27bf8` | corrida-1 ● |
| ✅ | 12 | arquitecto | Revisar y aceptar el avance de V-FUND | producto | `e1df2017-8fb7-467f-8038-39d19bf27bf8` | corrida-1 ● |
| ✅ | 17 | contratista2 | Informar 100% de V-FUND con evidencia | producto | `3f2a11df-3397-4529-87d8-98a25661f948` | corrida-1 ● |
| ✅ | 17 | arquitecto | Revisar y aceptar el avance de V-FUND | producto | `3f2a11df-3397-4529-87d8-98a25661f948` | corrida-1 ● |
| ✅ | 18 | contratista2 | Certificar más que el avance físico aceptado → 422 | validacion | — | corrida-1 ● |
| ✅ | 18 | contratista2 | Presentar el certificado 1 (fundaciones 100%) | producto | `36598c66-f180-4c92-a8fb-6a549690e169` | corrida-1 ● |
| ✅ | 18 | contratista2 | El contratista intenta aprobar su propio certificado → 403 | permiso | `36598c66-f180-4c92-a8fb-6a549690e169` | corrida-1 ● |
| ✅ | 18 | arquitecto | Aprobar un certificado sin evidencia → 422 | validacion | `36598c66-f180-4c92-a8fb-6a549690e169` | corrida-1 ● |
| ✅ | 18 | contratista2 | Adjuntar evidencia (solo remitos) | producto | `71e4dfd0-f049-480f-ac40-2f892836791e` | corrida-1 ● |
| ✅ | 18 | arquitecto | Pagar un certificado sin aprobar → 409 | validacion | `36598c66-f180-4c92-a8fb-6a549690e169` | corrida-1 ● |
| ✅ | 18 | arquitecto | Rechazar: falta el protocolo de probetas exigido por el pliego | producto | `36598c66-f180-4c92-a8fb-6a549690e169` | corrida-1 ● |
| ✅ | 19 | contratista2 | Corregir: sumar el protocolo de probetas y volver a presentar | producto | `36598c66-f180-4c92-a8fb-6a549690e169` | corrida-1 ● |
| ✅ | 19 | arquitecto | Aprobar el certificado corregido | producto | `36598c66-f180-4c92-a8fb-6a549690e169` | corrida-1 ● |
| ⬜ | 19 | arquitecto | Pagar el certificado 1 (escritura que puede cortarse) | recuperacion | — | corrida-1 |
| ⬜ | 19 | arquitecto | Pedir el pago otra vez con otra clave y con un pedido abortado: sigue habiendo un solo pago | idempotencia | — | — |
| ⬜ | 19 | arquitecto | Pagar los honorarios desde la caja de obra | producto | — | — |
| ⬜ | 19 | auditor | Releer lo persistido y contrastar lo que ve cada rol | auditoria | — | — |
| ⬜ | 20 | coordinador | Registrar la inspección de armaduras cumplida | producto | — | — |
| ⬜ | 28 | contratista2 | Informar 60% de V-ESTR con evidencia | producto | — | — |
| ⬜ | 28 | arquitecto | Revisar y aceptar el avance de V-ESTR | producto | — | — |
| ⬜ | 34 | contratista2 | Informar 100% de V-ESTR con evidencia | producto | — | — |
| ⬜ | 34 | arquitecto | Revisar y aceptar el avance de V-ESTR | producto | — | — |
| ⬜ | 35 | contratista2 | Presentar certificado 2 de «obra-gruesa» con evidencia | producto | — | — |
| ⬜ | 35 | arquitecto | Aprobar certificado 2 de «obra-gruesa» | producto | — | — |
| ⬜ | 36 | arquitecto | Pagar certificado 2 de «obra-gruesa» | producto | — | — |
| ⬜ | 42 | contratista2 | Empezar mampostería con la compra de ladrillos pendiente → 409 | validacion | — | — |
| ⬜ | 42 | coordinador | Registrar la compra de ladrillos recibida | producto | — | — |
| ⬜ | 53 | contratista2 | Informar 100% de V-MAMP con evidencia | producto | — | — |
| ⬜ | 53 | arquitecto | Revisar y aceptar el avance de V-MAMP | producto | — | — |
| ⬜ | 54 | contratista2 | Presentar certificado 3 de «obra-gruesa» con evidencia | producto | — | — |
| ⬜ | 54 | arquitecto | Aprobar certificado 3 de «obra-gruesa» | producto | — | — |
| ⬜ | 55 | arquitecto | Pagar certificado 3 de «obra-gruesa» | producto | — | — |
| ⬜ | 56 | inversor3 | Un inversor quiere salir: publica una orden de venta y nadie compra | producto | — | — |
| ⬜ | 60 | arquitecto | Recalcular el plan al cierre: físico, certificado y pagado | producto | — | — |
| ⬜ | 60 | inversor3 | Sin comprador, el inversor retira la orden y conserva su posición | producto | — | — |
| ⬜ | 60 | auditor | Releer lo persistido y contrastar lo que ve cada rol | auditoria | — | — |

## Edificio por etapas · estructura y paquetes comunes

Obra `e168d16b-a561-4b68-9e27-e4f1c567b7ff` · semilla 20261116 · corridas: corrida-1

| | Día | Actor | Acción | Tipo | ID del registro | Corrida |
|---|---|---|---|---|---|---|
| ✅ | 0 | arquitecto | Crear la obra | producto | `e168d16b-a561-4b68-9e27-e4f1c567b7ff` | corrida-1 ● |
| ✅ | 0 | arquitecto | Agendar a contratista1 | producto | `ac019c0c-8729-4cf1-be27-f73c470c649d` | corrida-1 ● |
| ✅ | 0 | arquitecto | Agendar a contratista2 | producto | `805b00e6-8cd7-495c-b2ea-ab9f99a9b586` | corrida-1 ● |
| ✅ | 0 | arquitecto | Agendar a contratista3 | producto | `46e4e03f-2730-4116-b0a2-b3e15eb18b17` | corrida-1 ● |
| ✅ | 0 | arquitecto | Sumar coordinador a la obra | producto | `3c043731-2529-41bf-825d-55374e03d02b` | corrida-1 ● |
| ✅ | 0 | arquitecto | Sumar auditor a la obra | producto | `3914f481-d9cb-4b3f-b98b-2e9e05ad7a24` | corrida-1 ● |
| ✅ | 0 | arquitecto | Cargar 4 unidades | producto | `e168d16b-a561-4b68-9e27-e4f1c567b7ff` | corrida-1 ● |
| ✅ | 0 | arquitecto | Publicar la obra en el feed | producto | `e168d16b-a561-4b68-9e27-e4f1c567b7ff` | corrida-1 ● |
| ✅ | 0 | inversor1 | Un inversor intenta leer el circuito interno de la obra → 403 | permiso | — | corrida-1 ● |
| ✅ | 1 | arquitecto | Crear pliego (ingeniería general) | producto | `990d294b-8677-434a-a47a-0dd48eb4b77c` | corrida-1 ● |
| ✅ | 1 | arquitecto | Cargar 8 partidas con alcance general | producto | `30ade029-7197-476f-87e3-11621cfef03d` | corrida-1 ● |
| ✅ | 1 | contratista1 | Un contratista intenta editar el pliego → 403 | permiso | — | corrida-1 ● |
| ✅ | 1 | arquitecto | Pasar a ingeniería de detalle | producto | `30ade029-7197-476f-87e3-11621cfef03d` | corrida-1 ● |
| ✅ | 1 | arquitecto | Intentar publicar sin cantidad, fuente, evidencia, criterio ni responsable → 422 | validacion | — | corrida-1 ● |
| ✅ | 1 | arquitecto | Completar cantidad, unidad, fuente y revisión, evidencia, criterio y responsable | producto | `30ade029-7197-476f-87e3-11621cfef03d` | corrida-1 ● |
| ✅ | 1 | arquitecto | Publicar el pliego (revisión 1) | producto | `30ade029-7197-476f-87e3-11621cfef03d` | corrida-1 ● |
| ✅ | 2 | coordinador | Planificar 10 tareas vinculadas a partidas | producto | `e168d16b-a561-4b68-9e27-e4f1c567b7ff` | corrida-1 ● |
| ✅ | 2 | contratista2 | Un contratista intenta cambiar el plan → 403 | permiso | — | corrida-1 ● |
| ✅ | 2 | coordinador | Intentar repartir más cantidad que la partida → 422 | validacion | — | corrida-1 ● |
| ✅ | 2 | arquitecto | Calcular cronograma y fijar línea base | producto | `902ed46c-500d-4764-8f0b-02676a145326` | corrida-1 ● |
| ✅ | 2 | coordinador | Verificar: partida común repartida en frentes y recursos compartidos sin superposición | producto | `e168d16b-a561-4b68-9e27-e4f1c567b7ff` | corrida-1 ● |
| ✅ | 3 | arquitecto | Registrar terreno y honorarios | producto | `3038e0a6-dd57-488c-b1ef-8fab932ac082` | corrida-1 ● |
| ✅ | 3 | arquitecto | Ronda 1 (etapa 1): terreno, estructura y honorarios | producto | `cc7e0d51-ead3-46f7-8760-372a6ffbd3a6` | corrida-1 ● |
| ✅ | 3 | arquitecto | Pedir cotización de «estructura» a tres contratistas | producto | `416d9621-13c3-4d9a-9745-d876d52d396e` | corrida-1 ● |
| ✅ | 4 | contratista1 | Cotizar la revisión recibida de «estructura» | producto | `b9377adc-2e23-4657-b2fe-f673e957d472` | corrida-1 ● |
| ✅ | 4 | inversor1 | Entrar por el feed y suscribir 1200 MCU | producto | `1e4770c5-283c-4ca2-8d09-b2eb586d56bc` | corrida-1 ● |
| ✅ | 4 | inversor2 | Entrar por el feed y suscribir 900 MCU | producto | `cca39cbd-f825-498e-8948-c297f62b007f` | corrida-1 ● |
| ✅ | 5 | contratista2 | Cotizar la revisión recibida de «estructura» | producto | `07472261-ec7b-4c7e-ac41-52be660f7dbe` | corrida-1 ● |
| ✅ | 5 | inversor1 | Integrar la suscripción (dinero ficticio a custodia de la ronda) | producto | `1e4770c5-283c-4ca2-8d09-b2eb586d56bc` | corrida-1 ● |
| ✅ | 5 | inversor2 | Integrar la suscripción (dinero ficticio a custodia de la ronda) | producto | `cca39cbd-f825-498e-8948-c297f62b007f` | corrida-1 ● |
| ✅ | 5 | inversor3 | Entrar por el feed y suscribir 480 MCU | producto | `90da530f-bf51-41ae-9c95-9c6943bf431c` | corrida-1 ● |
| ✅ | 6 | contratista3 | Cotizar la revisión recibida de «estructura» | producto | `c2741ce0-a236-49dc-b035-b5241ea9a5c4` | corrida-1 ● |
| ✅ | 6 | inversor3 | Integrar la suscripción (dinero ficticio a custodia de la ronda) | producto | `90da530f-bf51-41ae-9c95-9c6943bf431c` | corrida-1 ● |
| ✅ | 7 | arquitecto | Comparar las tres ofertas sobre la misma revisión | producto | `416d9621-13c3-4d9a-9745-d876d52d396e` | corrida-1 ● |
| ✅ | 7 | coordinador | El coordinador intenta adjudicar → 403 | permiso | — | corrida-1 ● |
| ✅ | 8 | arquitecto | Cerrar la ronda 1 | producto | `cc7e0d51-ead3-46f7-8760-372a6ffbd3a6` | corrida-1 ● |
| ✅ | 8 | arquitecto | Adjudicar «estructura» a contratista1 y publicar sus tareas | producto | `f038a4d8-3a27-4e46-8b9e-09514c6f8f47` | corrida-1 ● |
| ✅ | 9 | arquitecto | Pagar el terreno | producto | `3038e0a6-dd57-488c-b1ef-8fab932ac082` | corrida-1 ● |
| ✅ | 9 | arquitecto | Volver a licitar la estructura común ya contratada → 409 | validacion | — | corrida-1 ● |
| ✅ | 9 | inversor1 | Vincular la posición a la unidad A1 | producto | — | corrida-1 ● |
| ✅ | 9 | inversor2 | Otro inversor intenta vincularse a la misma unidad → 409 | validacion | — | corrida-1 ● |
| ✅ | 9 | inversor2 | Vincular la posición a la unidad B1 | producto | — | corrida-1 ● |
| ✅ | 9 | arquitecto | Imputar costos comunes a unidades por superficie, sin duplicar partidas | producto | `e168d16b-a561-4b68-9e27-e4f1c567b7ff` | corrida-1 ● |
| ✅ | 9 | auditor | Releer lo persistido y contrastar lo que ve cada rol | auditoria | `e168d16b-a561-4b68-9e27-e4f1c567b7ff` | corrida-1 ● |
| ⬜ | 23 | contratista1 | Informar 100% de E-FUND con evidencia | producto | — | — |
| ⬜ | 23 | arquitecto | Revisar y aceptar el avance de E-FUND | producto | — | — |
| ⬜ | 24 | contratista1 | Presentar certificado 1 de «estructura» con evidencia | producto | — | — |
| ⬜ | 24 | arquitecto | Aprobar certificado 1 de «estructura» | producto | — | — |
| ⬜ | 25 | arquitecto | Pagar certificado 1 de «estructura» | producto | — | — |
| ⬜ | 25 | arquitecto | Pedir cotización de «instalaciones» a tres contratistas | producto | — | — |
| ⬜ | 26 | contratista1 | Cotizar la revisión recibida de «instalaciones» | producto | — | — |
| ⬜ | 27 | contratista2 | Cotizar la revisión recibida de «instalaciones» | producto | — | — |
| ⬜ | 28 | contratista3 | Cotizar la revisión recibida de «instalaciones» | producto | — | — |
| ⬜ | 29 | arquitecto | Comparar las tres ofertas sobre la misma revisión | producto | — | — |
| ⬜ | 29 | coordinador | El coordinador intenta adjudicar → 403 | permiso | — | — |
| ⬜ | 30 | arquitecto | Adjudicar «instalaciones» a contratista2 y publicar sus tareas | producto | — | — |
| ⬜ | 30 | arquitecto | Pagar honorarios | producto | — | — |
| ⬜ | 35 | contratista1 | Informar 100% de E-EST-PB con evidencia | producto | — | — |
| ⬜ | 35 | arquitecto | Revisar y aceptar el avance de E-EST-PB | producto | — | — |
| ⬜ | 38 | arquitecto | Ronda 2 (etapa 2): necesidad calculada desde contratos, cronograma de pagos y caja | producto | — | — |
| ⬜ | 39 | inversor2 | Suscribir e integrar 40% de la ronda 2 | producto | — | — |
| ⬜ | 40 | inversor3 | Suscribir e integrar el resto de la ronda 2 | producto | — | — |
| ⬜ | 44 | arquitecto | Cerrar la ronda 2 y medir el efecto sobre inversores anteriores, nuevos y caja | producto | — | — |
| ⬜ | 45 | arquitecto | Pedir cotización de «terminaciones» a tres contratistas | producto | — | — |
| ⬜ | 46 | contratista1 | Cotizar la revisión recibida de «terminaciones» | producto | — | — |
| ⬜ | 47 | contratista2 | Cotizar la revisión recibida de «terminaciones» | producto | — | — |
| ⬜ | 48 | contratista3 | Cotizar la revisión recibida de «terminaciones» | producto | — | — |
| ⬜ | 49 | arquitecto | Comparar las tres ofertas sobre la misma revisión | producto | — | — |
| ⬜ | 49 | coordinador | El coordinador intenta adjudicar → 403 | permiso | — | — |
| ⬜ | 50 | arquitecto | Adjudicar «terminaciones» a contratista3 y publicar sus tareas | producto | — | — |
| ⬜ | 50 | contratista2 | Informar 100% de I-SAN con evidencia | producto | — | — |
| ⬜ | 50 | arquitecto | Revisar y aceptar el avance de I-SAN | producto | — | — |
| ⬜ | 52 | contratista1 | Informar 100% de E-EST-N1 con evidencia | producto | — | — |
| ⬜ | 52 | arquitecto | Revisar y aceptar el avance de E-EST-N1 | producto | — | — |
| ⬜ | 53 | contratista1 | Certificar la partida común por encima de los frentes terminados → 422 | validacion | — | — |
| ⬜ | 53 | contratista1 | Presentar certificado 2 de «estructura» con evidencia | producto | — | — |
| ⬜ | 53 | arquitecto | Aprobar certificado 2 de «estructura» | producto | — | — |
| ⬜ | 54 | arquitecto | Pagar certificado 2 de «estructura» | producto | — | — |
| ⬜ | 54 | auditor | Releer lo persistido y contrastar lo que ve cada rol | auditoria | — | — |
| ⬜ | 55 | coordinador | Registrar la compra del tablero recibida | producto | — | — |
| ⬜ | 57 | coordinador | Registrar la inspección de estructura cumplida | producto | — | — |
| ⬜ | 60 | inversor1 | Ofrecer más MCU de las que se tienen → 422 | validacion | — | — |
| ⬜ | 60 | inversor1 | Publicar una orden de venta de 300 MCU | producto | — | — |
| ⬜ | 61 | inversor3 | Comprar la orden: la posición cambia de titular y el dinero va al vendedor | producto | — | — |
| ⬜ | 61 | inversor2 | Comprar una orden ya ejecutada → 409 | validacion | — | — |
| ⬜ | 66 | contratista2 | Informar 100% de I-ELE con evidencia | producto | — | — |
| ⬜ | 66 | arquitecto | Revisar y aceptar el avance de I-ELE | producto | — | — |
| ⬜ | 67 | contratista2 | Presentar certificado 1 de «instalaciones» con evidencia | producto | — | — |
| ⬜ | 67 | arquitecto | Aprobar certificado 1 de «instalaciones» | producto | — | — |
| ⬜ | 67 | contratista1 | Informar 100% de E-EST-CUB con evidencia | producto | — | — |
| ⬜ | 67 | arquitecto | Revisar y aceptar el avance de E-EST-CUB | producto | — | — |
| ⬜ | 68 | arquitecto | Pagar certificado 1 de «instalaciones» | producto | — | — |
| ⬜ | 68 | contratista1 | Presentar certificado 3 de «estructura» con evidencia | producto | — | — |
| ⬜ | 68 | arquitecto | Aprobar certificado 3 de «estructura» | producto | — | — |
| ⬜ | 69 | arquitecto | Pagar certificado 3 de «estructura» | producto | — | — |
| ⬜ | 78 | contratista3 | Informar 100% de T-A1 con evidencia | producto | — | — |
| ⬜ | 78 | arquitecto | Revisar y aceptar el avance de T-A1 | producto | — | — |
| ⬜ | 88 | contratista3 | Informar 100% de T-A2 con evidencia | producto | — | — |
| ⬜ | 88 | arquitecto | Revisar y aceptar el avance de T-A2 | producto | — | — |
| ⬜ | 89 | contratista3 | Presentar certificado 1 de «terminaciones» con evidencia | producto | — | — |
| ⬜ | 89 | arquitecto | Aprobar certificado 1 de «terminaciones» | producto | — | — |
| ⬜ | 90 | arquitecto | Pagar certificado 1 de «terminaciones» | producto | — | — |
| ⬜ | 98 | contratista3 | Informar 100% de T-B1 con evidencia | producto | — | — |
| ⬜ | 98 | arquitecto | Revisar y aceptar el avance de T-B1 | producto | — | — |
| ⬜ | 108 | contratista3 | Informar 100% de T-B2 con evidencia | producto | — | — |
| ⬜ | 108 | arquitecto | Revisar y aceptar el avance de T-B2 | producto | — | — |
| ⬜ | 109 | contratista3 | Presentar certificado 2 de «terminaciones» con evidencia | producto | — | — |
| ⬜ | 109 | arquitecto | Aprobar certificado 2 de «terminaciones» | producto | — | — |
| ⬜ | 110 | arquitecto | Pagar certificado 2 de «terminaciones» | producto | — | — |
| ⬜ | 112 | arquitecto | Obra terminada: liberar la reserva y distribuir excedente a prorrata de MCU | producto | — | — |
| ⬜ | 112 | arquitecto | Plan al cierre: físico, certificado y pagado por separado | producto | — | — |
| ⬜ | 112 | auditor | Releer lo persistido y contrastar lo que ve cada rol | auditoria | — | — |

## Obra con fallas combinadas

Obra `6ce8365b-df51-4b24-9b6c-94487bf5dd72` · semilla 20261116 · corridas: corrida-1

| | Día | Actor | Acción | Tipo | ID del registro | Corrida |
|---|---|---|---|---|---|---|
| ✅ | 0 | arquitecto | Crear la obra | producto | `6ce8365b-df51-4b24-9b6c-94487bf5dd72` | corrida-1 ● |
| ✅ | 0 | arquitecto | Agendar a contratista1 | producto | `ac019c0c-8729-4cf1-be27-f73c470c649d` | corrida-1 ● |
| ✅ | 0 | arquitecto | Agendar a contratista2 | producto | `805b00e6-8cd7-495c-b2ea-ab9f99a9b586` | corrida-1 ● |
| ✅ | 0 | arquitecto | Agendar a contratista3 | producto | `46e4e03f-2730-4116-b0a2-b3e15eb18b17` | corrida-1 ● |
| ✅ | 0 | arquitecto | Sumar coordinador a la obra | producto | `24754a32-9163-4411-8eb3-417fbdff5497` | corrida-1 ● |
| ✅ | 0 | arquitecto | Sumar auditor a la obra | producto | `97027bcb-7a6f-4b13-9952-f65e5ed20b8e` | corrida-1 ● |
| ✅ | 0 | arquitecto | Publicar la obra en el feed | producto | `6ce8365b-df51-4b24-9b6c-94487bf5dd72` | corrida-1 ● |
| ✅ | 0 | inversor1 | Un inversor intenta leer el circuito interno de la obra → 403 | permiso | — | corrida-1 ● |
| ✅ | 1 | arquitecto | Crear pliego (ingeniería general) | producto | `7db670d7-e58d-4b69-bbf5-a7d4b7128754` | corrida-1 ● |
| ✅ | 1 | arquitecto | Cargar 3 partidas con alcance general | producto | `8944add2-6465-45c4-b305-e6b8d1a83821` | corrida-1 ● |
| ✅ | 1 | contratista1 | Un contratista intenta editar el pliego → 403 | permiso | — | corrida-1 ● |
| ✅ | 1 | arquitecto | Pasar a ingeniería de detalle | producto | `8944add2-6465-45c4-b305-e6b8d1a83821` | corrida-1 ● |
| ✅ | 1 | arquitecto | Intentar publicar sin cantidad, fuente, evidencia, criterio ni responsable → 422 | validacion | — | corrida-1 ● |
| ✅ | 1 | arquitecto | Completar cantidad, unidad, fuente y revisión, evidencia, criterio y responsable | producto | `8944add2-6465-45c4-b305-e6b8d1a83821` | corrida-1 ● |
| ✅ | 1 | arquitecto | Publicar el pliego (revisión 1) | producto | `8944add2-6465-45c4-b305-e6b8d1a83821` | corrida-1 ● |
| ✅ | 2 | coordinador | Planificar 3 tareas vinculadas a partidas | producto | `6ce8365b-df51-4b24-9b6c-94487bf5dd72` | corrida-1 ● |
| ✅ | 2 | contratista2 | Un contratista intenta cambiar el plan → 403 | permiso | — | corrida-1 ● |
| ✅ | 2 | coordinador | Intentar repartir más cantidad que la partida → 422 | validacion | — | corrida-1 ● |
| ✅ | 2 | arquitecto | Calcular cronograma y fijar línea base | producto | `5e5d2a4c-a51d-4333-87e5-631fdb70e83b` | corrida-1 ● |
| ✅ | 3 | arquitecto | Registrar terreno, honorarios y reserva | producto | `8162239b-01ca-4869-a9f7-1ead73f58677` | corrida-1 ● |
| ✅ | 3 | arquitecto | Ronda 1 por el 100% de la necesidad (umbral 80%) | producto | `d69974ea-85b9-4137-a84f-85832901d8ce` | corrida-1 ● |
| ✅ | 3 | arquitecto | Pedir cotización de «estructura» a tres contratistas | producto | `1f439506-b7db-4e42-b307-48eb1251554c` | corrida-1 ● |
| ✅ | 4 | contratista1 | Cotizar la revisión recibida de «estructura» | producto | `c7757798-e39b-47c3-b7fc-e2293dbef2d3` | corrida-1 ● |
| ✅ | 4 | inversor1 | Suscribir 35% de la ronda1 e integrar | producto | `c08c89e8-1889-4e86-bbb0-91666ce8f4d5` | corrida-1 ● |
| ✅ | 4 | inversor2 | Suscribir 40% de la ronda1 SIN integrar (solo promesa) | producto | `45c43586-756e-49be-af44-d0d0146f1ee1` | corrida-1 ● |
| ✅ | 5 | contratista2 | Cotizar la revisión recibida de «estructura» | producto | `01363f80-0f0f-48b0-86d9-e7b75124b005` | corrida-1 ● |
| ✅ | 5 | inversor3 | Suscribir 20% de la ronda1 e integrar | producto | `6de223c4-aab5-40d7-ae7c-c1c76c8ac2af` | corrida-1 ● |
| ✅ | 6 | contratista3 | Cotizar la revisión recibida de «estructura» | producto | `a9232744-bdf1-40e8-a2c5-694455aca796` | corrida-1 ● |
| ✅ | 7 | arquitecto | Comparar las tres ofertas sobre la misma revisión | producto | `1f439506-b7db-4e42-b307-48eb1251554c` | corrida-1 ● |
| ✅ | 7 | coordinador | El coordinador intenta adjudicar → 403 | permiso | — | corrida-1 ● |
| ✅ | 8 | arquitecto | Cerrar la ronda 1: lo integrado (55%) no alcanza el umbral → falla y se devuelve | producto | `d69974ea-85b9-4137-a84f-85832901d8ce` | corrida-1 ● |
| ✅ | 9 | arquitecto | Pagar el terreno sin caja → 409 fondos insuficientes | validacion | — | corrida-1 ● |
| ✅ | 9 | arquitecto | Adjudicar «estructura» a contratista3 y publicar sus tareas | producto | `12a7f5e3-3885-4673-aeb0-37b2a585def4` | corrida-1 ● |
| ✅ | 9 | arquitecto | Sin capital: reprogramar el inicio de obra y reflejarlo en plan y feed | producto | `6ce8365b-df51-4b24-9b6c-94487bf5dd72` | corrida-1 ● |
| ✅ | 10 | arquitecto | Ronda 2 a menor precio (umbral 60%) | producto | `0febe4ee-98a8-43c5-ac1e-a4c55798f0d7` | corrida-1 ● |
| ✅ | 11 | inversor1 | Suscribir 45% de la ronda2 e integrar | producto | `ee6115f1-fb49-41c6-bd21-32f93d05858a` | corrida-1 ● |
| ✅ | 11 | inversor3 | Suscribir 30% de la ronda2 e integrar | producto | `05c0c449-0b50-4326-96e0-42c79fc54e1d` | corrida-1 ● |
| ✅ | 12 | inversor2 | Suscribir 25% de la ronda2 SIN integrar (solo promesa) | producto | `ce9d7fe5-e129-4542-9f21-f2e539e57c7a` | corrida-1 ● |
| ✅ | 14 | arquitecto | Cerrar la ronda 2: supera el umbral pero queda incompleta | producto | `0febe4ee-98a8-43c5-ac1e-a4c55798f0d7` | corrida-1 ● |
| ✅ | 16 | contratista3 | Informar avance con la obra reprogramada → 409 | validacion | — | corrida-1 ● |
| ⬜ | 20 | arquitecto | Reanudar por etapas con capital parcial y pagar terreno y honorarios | producto | — | — |
| ⬜ | 27 | contratista3 | Informar 100% de demolición con una foto sin fecha | producto | — | — |
| ⬜ | 27 | arquitecto | Rechazar la evidencia: observar el avance | producto | — | — |
| ⬜ | 27 | contratista3 | Informar otro avance con uno observado pendiente → 409 | validacion | — | — |
| ⬜ | 28 | contratista3 | Corregir la observación con evidencia nueva | producto | — | — |
| ⬜ | 28 | arquitecto | Aceptar el avance corregido | producto | — | — |
| ⬜ | 29 | contratista3 | Presentar el certificado 1 (demolición) | producto | — | — |
| ⬜ | 29 | arquitecto | Rechazar el certificado: acta sin firma | producto | — | — |
| ⬜ | 30 | contratista3 | Corregir con el acta firmada | producto | — | — |
| ⬜ | 30 | arquitecto | Aprobar y pagar el certificado corregido | producto | — | — |
| ⬜ | 30 | coordinador | La compra de acero se demora 20 días: replanificar y reflejar el atraso | producto | — | — |
| ⬜ | 31 | arquitecto | Pedir cotización de «cubierta» sobre la revisión 1 | producto | — | — |
| ⬜ | 33 | arquitecto | Cambio de alcance: revisión 2 del pliego (más hormigón por estudio de suelos, cubierta con aislación doble) | producto | — | — |
| ⬜ | 33 | contratista2 | Cotizar la solicitud de la revisión reemplazada → 409 | validacion | — | — |
| ⬜ | 33 | arquitecto | Adjudicar una oferta hecha sobre la revisión reemplazada → 409 | validacion | — | — |
| ⬜ | 34 | arquitecto | Proponer adenda al contrato de estructura por la revisión 2 (sube el costo) | producto | — | — |
| ⬜ | 34 | arquitecto | El responsable intenta aceptar su propia adenda → 403 | permiso | — | — |
| ⬜ | 34 | arquitecto | Pedir cotización de «cubierta» a tres contratistas | producto | — | — |
| ⬜ | 35 | contratista3 | El contratista acepta la adenda: sube el contrato y la necesidad de fondos | producto | — | — |
| ⬜ | 35 | contratista1 | Cotizar la revisión recibida de «cubierta» | producto | — | — |
| ⬜ | 36 | contratista2 | Cotizar la revisión recibida de «cubierta» | producto | — | — |
| ⬜ | 37 | contratista3 | Cotizar la revisión recibida de «cubierta» | producto | — | — |
| ⬜ | 38 | arquitecto | Comparar las tres ofertas sobre la misma revisión | producto | — | — |
| ⬜ | 38 | coordinador | El coordinador intenta adjudicar → 403 | permiso | — | — |
| ⬜ | 38 | arquitecto | Adjudicar «cubierta» a contratista1 y publicar sus tareas | producto | — | — |
| ⬜ | 38 | auditor | Releer lo persistido y contrastar lo que ve cada rol | auditoria | — | — |
| ⬜ | 38 | arquitecto | Ronda 3 por la suba de costo, a menor precio (umbral 90%) | producto | — | — |
| ⬜ | 38 | inversor1 | Ver en la ficha el efecto de la ronda 3 sobre inversores anteriores, nuevos y caja | producto | — | — |
| ⬜ | 39 | inversor2 | Suscribir 70% de la ronda3 SIN integrar (solo promesa) | producto | — | — |
| ⬜ | 40 | inversor1 | Suscribir 20% de la ronda3 e integrar | producto | — | — |
| ⬜ | 42 | arquitecto | Cerrar la ronda 3: falla; nadie se diluye y la caja no cambia | producto | — | — |
| ⬜ | 45 | coordinador | Llega el acero | producto | — | — |
| ⬜ | 50 | inversor3 | Un inversor quiere salir: publica toda su posición y nadie compra | producto | — | — |
| ⬜ | 57 | contratista3 | Informar 50% de F-EST con evidencia | producto | — | — |
| ⬜ | 57 | arquitecto | Revisar y aceptar el avance de F-EST | producto | — | — |
| ⬜ | 58 | contratista3 | Certificado 2 (estructura 50%): presentado, aprobado y pagado | producto | — | — |
| ⬜ | 66 | contratista3 | Informar 60% de F-EST con evidencia | producto | — | — |
| ⬜ | 66 | arquitecto | Revisar y aceptar el avance de F-EST | producto | — | — |
| ⬜ | 67 | arquitecto | Certificado 3 aprobado pero impago: la caja no alcanza sin tocar la reserva → 409 | validacion | — | — |
| ⬜ | 67 | arquitecto | Liquidar a inversores con la obra en curso → 409 | validacion | — | — |
| ⬜ | 68 | arquitecto | Entrar en proceso de cierre: se cancelan órdenes y la reserva se libera | producto | — | — |
| ⬜ | 68 | contratista3 | En cierre no se informa avance ni se abren rondas → 409 | validacion | — | — |
| ⬜ | 68 | arquitecto | Liquidar a inversores con un certificado aprobado impago → 409 (cobra primero el contratista) | validacion | — | — |
| ⬜ | 69 | arquitecto | Pagar el certificado 3 con la reserva liberada | producto | — | — |
| ⬜ | 70 | arquitecto | Liquidar el remanente a prorrata de MCU y cerrar la obra | producto | — | — |
| ⬜ | 70 | auditor | Releer lo persistido y contrastar lo que ve cada rol | auditoria | — | — |

● = ejecutado en esta corrida.
