# Estado de Negocio - Lógica de Negocio GROWS

**Última actualización:** Diciembre 2024  
**Versión:** MVP Operativo  
**Fuente de verdad:** Este documento

---

## 🔴 CAMBIO ESTRUCTURAL — ACTUALIZACIÓN LÓGICA DE NEGOCIO GROWS (POST E2E)

### Estado
Definiciones consolidadas para MVP operativo y modelo objetivo.

---

### 1. CAMBIO ESTRUCTURAL DEL MODELO DE NEGOCIO

❌ **Se elimina completamente:**
- Modelo de suscripciones
- Planes pagos fijos
- Cobros visibles al usuario

✅ **Nuevo modelo único:**
- Modelo 100% comisión sobre obra, integrada al presupuesto.
- El socio presenta su presupuesto NETO.
- GROWS agrega automáticamente su comisión.
- El arquitecto aprueba o rechaza el total.
- Para el usuario, GROWS "parece gratis".

📌 **La comisión es un costo de obra, no un pago explícito del usuario.**

---

### 2. COMISIÓN VARIABLE — NÚCLEO DEL SISTEMA

- La comisión NO es fija.
- Se calcula dinámicamente según condiciones reales del mercado.
- Nunca se muestra al usuario como "tasa" o "porcentaje".

**Principio rector:**
- Alta demanda + baja oferta → comisión más alta.
- Baja demanda + alta oferta → comisión más baja.

Este mecanismo es el motor económico central de GROWS.

---

### 3. VARIABLES QUE DEFINEN LA COMISIÓN

La comisión final es la suma de factores.

#### 3.1 Índice IT (Intensidad de Trabajo)
Calculado por:
- Ciudad
- Etapa de obra

**Pesos por etapa:**
- Tarea suelta: +3%
- Estructura: +2%
- Obra gris: +3%
- Terminaciones: +4%

📌 Las terminaciones implican mayor riesgo operativo.

---

#### 3.2 Relación Oferta / Demanda (factor principal)

**Variables:**
- Cantidad de obras activas
- Cantidad de cuadrillas activas en la ciudad

**Regla:**
- Muchas obras / pocas cuadrillas → comisión ALTA
- Pocas obras / muchas cuadrillas → comisión BAJA

📌 Este factor regula la cobertura de obra en tiempo real.

---

#### 3.3 Volumen de trabajo del arquitecto
- Arquitectos con muchas obras activas → menor comisión.
- Arquitectos con pocas obras → mayor comisión.

📌 Incentivo a centralizar obras dentro de GROWS.

---

#### 3.4 Relación previa / confianza
- Socio invitado por el arquitecto → comisión reducida.
- Socio con historial previo → prioridad + menor comisión.

---

### 4. PRIORIDAD DE VISIBILIDAD (NO TARIFA)

Sistema de ventanas de oferta (inspirado en Uber, sin subasta de precios):

- **Primeras 4 hs:**
  Socios activos en la obra
- **Hasta 6 hs:**
  Socios que trabajaron con ese arquitecto / zona cercana
- **A las 8 hs:**
  Se abre a todos

**Límite:**
- Máximo 5–6 presupuestos por tarea

📌 Evita saturación y ruido operativo.

---

### 5. TAREAS, FASES Y BLOQUES (SIMPLIFICACIÓN)

- Una fase = una cuadrilla principal.
- Evitar múltiples cuadrillas en una misma tarea grande.

**Ejemplo:**
- Obra gris: revoque + pisos idealmente misma cuadrilla.

**Bloques:**
- NO dividen la tarea.
- Sirven para:
  - validar
  - pagar
  - medir avance diario mínimo

📌 Un bloque = lo mínimo validable por día.

---

### 6. VALIDACIÓN Y PAGO (SEPARADOS)

**Regla clave:**
- Todas las tareas se validan por evidencia (fotos).
- El arquitecto decide la forma de pago:
  - 💳 Digital
  - 💵 Pago en obra

**El socio:**
- NO ve cómo paga el arquitecto.
- Solo ve estados: validado / pagado.

**Tipos de validación:**
- Remota (fotos)
- Presencial
- Profesional (remito / inspección)

📌 La decisión final siempre es del arquitecto.

---

### 7. SALDO NEGATIVO Y BLOQUEOS (CICLO SEMANAL)

**Regla:**
- El bloqueo afecta solo al deudor.

**Arquitecto:**
- No paga → no puede aprobar nuevas tareas.

**Socio:**
- No paga comisión →
  ❌ No puede tomar tareas "pago en obra"
  ✅ Sí puede tomar tareas de pago digital para recuperar deuda

**Ciclo:**
- Lunes: corte de estado
- 72 hs para regularizar
- Si no paga → bloqueo hasta el lunes siguiente

📌 Sistema predecible, sin fricción diaria.

---

### 8. PRESUPUESTOS LARGOS

- Presupuestos > 120 días:
  - Vigencia automática: 90 días
  - Luego puede solicitar renegociación
  - Arquitecto acepta o rechaza

📌 Sin inflación visible, sin fricción operativa.

---

### 9. ROLES Y AUTORIDAD

**Arquitecto:**
- Aprueba presupuestos
- Valida bloques y tareas
- Define forma de pago
- Puede bloquear tareas por mala ejecución

**Socio:**
- Presupuesta
- Ejecuta
- Sube evidencias
- Cobra

📌 La autoridad final siempre es del arquitecto.

---

### 10. ESTADO DE IMPLEMENTACIÓN

✔ **Definido:**
- Modelo económico
- Comisión variable
- Oferta / demanda
- Bloques
- Validación
- Saldo negativo
- Presupuestos largos

⏳ **Pendiente (post-E2E):**
- Fórmula exacta final de comisión
- Parametrización por ciudad
- Ajuste fino de FSM

---

## Estado actual

**Modelo económico:** DEFINIDO  
**Implementación:** PARCIAL (post E2E)  
**Impacto en sprint actual:** DOCUMENTACIÓN / CONGELADO  
**Fuente de verdad:** ESTE ARCHIVO

---

**FIN DEL DOCUMENTO**
