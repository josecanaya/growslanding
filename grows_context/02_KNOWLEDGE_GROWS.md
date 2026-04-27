# GROWS — Qué es y cómo fluye

Aplicación de **ejecución de obra**: cliente/organización planifica y valida; socio ejecuta por bloques y cobra vía wallet menos comisiones.

---

## Actores y piezas

- **Organización:** plan, límites de obras activas, comisiones (FREE / PRO / ENTERPRISE según reglas del negocio).
- **Obra:** ciclo de vida; tope de obras activas según plan.
- **Tarea:** unidad asignable al socio; días de presupuesto y bloques planificados alineados.
- **Bloque (subtarea):** unidad operativa y pagable por día/índice; montos; evidencia obligatoria cuando corresponde.
- **Presupuesto:** origen de montos y de generación de tareas/bloques.
- **Jornada:** registro diario del socio.
- **Wallet:** saldos y movimientos; comisión para la plataforma; pago efectivo u online según escrow.

---

## Cadena core (invariante)

```
obra → tarea → bloque → evidencia → validación (cliente) → pago → wallet
```

**Socio:** jornada, vista operativa “Ahora”, avanza tarea a en progreso, trabaja bloques y evidencias, lleva la tarea a estado de revisión del cliente. **No** se dispara el pago solo por “terminar” desde el socio.

**Cliente:** revisa y valida (o rechaza según reglas). Al validar tarea se encadenan pago / liberación de fondos y movimientos en wallet.

---

## Bloques

- Cantidad de bloques acorde a días de presupuesto de la tarea.
- Montos por bloque alineados al presupuesto.
- Puede exigirse evidencia cargada antes de validar bloque.
- Límites de cuántas cosas pueden estar en progreso a la vez por socio: reglas de negocio; no eliminar sin decisión explícita.

---

## Validación

- Bloques pueden validarse con reglas de evidencia.
- Tarea: solo el rol cliente hace la transición de cierre positivo cuando el FSM lo permite; intentos inválidos deben fallar en API.
- Validar tarea conecta con dinero: la UI no puede ser la única barrera.

---

## Estados

Conviven strings viejos en base con nombres actuales. **Oficiales** de tarea incluyen: `pendiente`, `en_progreso`, `para_validar`, `validada`, `rechazada`. Subtareas usan su propio conjunto (incl. validado/rechazado a nivel bloque). Nuevas piezas deben usar la nomenclatura vigente y pasar por el flujo de transiciones del proyecto, no strings sueltos.

---

## Planes (resumen)

- FREE: comisión variable en rango; límite de obras activas acotado.
- PRO / ENTERPRISE: comisiones fijas más bajas, más cupo; enterprise puede tener coste por obra extra.

---

## Interfaz

- **Socio:** operación, tareas, evidencias, dinero, presupuestos.
- **Cliente:** obras, validación, presupuesto, seguimiento.

La referencia visual de diseño define aspecto; las reglas de negocio viven en servidor y dominio.

---

## Prioridad al decidir

1. Coherencia de estados y dinero.  
2. Seguridad de mutaciones.  
3. Operabilidad clara para socio y cliente.

---

## Qué tiene que lograr la app

La app debe permitir:

- ejecutar obra **real** (no solo planificar en abstracto)
- asignar trabajo a socios
- registrar ejecución (evidencia)
- validar trabajo (cliente)
- registrar pagos (incluye efectivo u otros medios según reglas del sistema)

→ **Si no hay ejecución real trazable, la app no cumple su propósito.**

---

## Uso en la vida real

**Cliente:** crea obra; arma tareas; asigna socio; valida trabajo; paga o dispara el registro de pago según el modelo (validación → pago).

**Socio:** ve tareas; ejecuta; sube evidencia; deja el trabajo en condiciones de validación del cliente.

---

## Acciones que la app debe poder (diseño objetivo)

- crear obra  
- crear tarea  
- dividir en bloques  
- ejecutar bloques  
- validar bloques (donde aplique)  
- validar tarea  
- generar / registrar pago  
- registrar en wallet  

---

## Qué NO debe hacer la app

- no depender de IA para el flujo operativo core  
- no ser solo capa visual sin reglas en servidor  
- no permitir saltear validación del cliente donde el negocio la exige  
- no pagar sin validación según el modelo vigente  

---

## Modelo de negocio (clave)

- **Suscripción / plan:** fee recurrente; límites de obras u operación según tier (escalabilidad: más cupo o funciones al subir plan).  
- **Take rate:** comisión por operación/tarea sobre el flujo ejecutado y validado.  

→ **Grows gana cuando hay ejecución real** registrada, validada y monetizada (comisión + retención por valor del plan).

---

## Regla de estabilidad

Este archivo **no** se modifica por retoques editoriales. Solo ante **cambio real de negocio, flujo o propósito de la app** acordado.
