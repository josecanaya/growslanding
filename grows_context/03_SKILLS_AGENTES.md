# Tipo de tarea — Qué hacer

Elegí un tipo antes de editar. No mezclar frontend + backend + datos en un mismo cambio salvo que el pedido sea explícitamente un hotfix único.

---

## Regla de aislamiento

Un cambio usa **una** skill. Si hace falta más de una → dividir en varias ejecuciones.

---

## Transversal

- Referencia visual = solo UI; negocio en API/servicios.
- Si no podés verificar el resultado, el alcance está mal pedido.

---

## Frontend

**Cuándo:** pantallas, componentes, estilos, navegación, copiar layout de diseño.

**Hacé:** reutilizar patrones ya en la app; datos vía APIs/hooks existentes; estados vacíos y error visibles.

**No:** permisos solo en cliente; confiar en cabeceras para saber usuario/org; cambiar contrato de API solo desde el front.

---

## Backend

**Cuándo:** rutas API, servicios, reglas servidor.

**Hacé:** buscar servicio ya existente (transiciones de tarea, wallet, permisos, escrow) antes de duplicar; validar sesión y pertenencia en mutaciones; estados alineados al enum/transiciones del dominio.

**No:** strings de estado nuevos y paralelos; endpoints que acepten IDs sin chequear que el actor puede actuar; dos implementaciones contradictorias de pago.

---

## Data

**Cuándo:** tablas, RLS, migraciones, tipos alineados al esquema.

**Hacé:** migración coherente; revisar políticas si hay datos sensibles; tras esquema, actualizar consumidores rotos.

**No:** tirar constraints que expresan negocio (evidencia, límites) sin reemplazo; dos escritores activos al mismo concepto sin estrategia fijada en memoria.

---

## Flow

**Cuándo:** cruza estados, jornada, CPM, “Ahora”, validación, pagos.

**Hacé:** recorrer mentalmente SOCIO vs CLIENTE y efecto en wallet; respetar orden validación → pago.

**No:** asumir que “terminado” paga sin pasar por validación; saltear escrow/liberación sin entrada en memoria.

---

## QA

**Cuándo:** el usuario pidió verificación o tocás el núcleo (estados/dinero).

**Hacé:** al menos un camino feliz y uno de error (p. ej. transición ilegal); lint en archivos tocados.

**No:** decir “probado” sin decir qué acción ejecutaste.

---

## Cleanup

**Cuándo:** borrar muerto con seguridad, aislar legacy.

**Hacé:** cambios chicos; deprecar antes de borrar masivo; no tocar landing salvo pedido.

**No:** borrar sin buscar imports/rutas dinámicas.

---

## Señal → tipo

| Pedido suena a… | Tipo     |
|-----------------|----------|
| Pantalla, botón, diseño | Frontend |
| API, 500, transición   | Backend  |
| Tabla, RLS, migración  | Data     |
| Pago mal, estado mal   | Flow     |
| Probar, regresión      | QA       |
| Código muerto, Prisma  | Cleanup  |

---

## Qué significa ejecutar bien

Un cambio está bien si:

- funciona en **flujo real** (campo: tarea → evidencia → validación → pago cuando aplica)
- **no** rompe lo que ya funcionaba
- mantiene **consistencia de datos** (misma verdad en UI y servidor)

---

## Pedido inválido o ambiguo

Si el pedido:

- no es claro
- contradice el flujo core
- no se puede verificar

Entonces:

→ **no** ejecutar a ciegas  
→ pedir aclaración **o** elegir la interpretación **mínima** y segura

---

## Regla de impacto

Si el cambio toca **pagos**, **validación** o **estados**:

→ cuidado máximo  
→ **usar** lógica y servicios ya existentes; no inventar camino paralelo

---

## Qué NO hacer nunca

- crear lógica paralela al dominio actual
- inventar endpoints si ya existe cobertura
- inventar estados
- duplicar servicios
