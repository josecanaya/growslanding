# Auditoría: uso real del schema Supabase en Grows (`apps/web`)

**Alcance:** cruce entre el schema exportado (abril 2026) y el código en `growslanding/apps/web`.  
**Restricción de esta tarea:** solo documentación; sin cambios de código, migraciones aplicadas en repo, UI ni despliegue.  
**Fecha del análisis:** 24 abr 2026.

---

## 1. Resumen ejecutivo

- **Fuente canónica de organizaciones en producción Supabase:** `public.organizations`. El código mantiene **fallback** a una tabla legacy `organizaciones` (plan, permisos, wallet) cuando falla o no existe el registro esperado; en el schema que pegaste **solo aparece `organizations`**, así que las rutas que leen `organizaciones` son **deuda técnica / compatibilidad** y pueden devolver vacío sin error explícito.
- **Doble vía de datos:** gran parte del flujo core (obras, tareas, socios, wallet MVP, escrow, legajo) usa **Supabase con `createServiceSupabaseClient()`** (service role). **Prisma** sigue presente en `lib/services/tarea.service.ts`, `suscripcion.service.ts`, `tareas.service.ts` y APIs `app/api/roadmap/*` + scripts; el riesgo es **inconsistencia** si algún flujo antiguo sigue llamando Prisma contra otra base o esquema.
- **Socios y organizaciones:** en tu export, `socios.org_id` ya es **nullable**. El **código de negocio** aún exige en varios endpoints que el socio “pertenezca” a la org del cliente (misma `org_id`) para asignar tareas o filtrar listados. Eso **choca** con el objetivo de “socios libres, solo agendados por el usuario”. La reforma correcta es **desacoplar membresía** (`org_id` en `socios`) de **relación cliente ↔ socio** (`cliente_socio_agenda` + `tareas.responsable_socio_id` / copia lógica).
- **Tablas en código que no aparecen en tu JSON de schema:** `cliente_socio_agenda`, `qr_tokens`, y probablemente `public_codigo` en `socios`; además `tareas_evidencias`, `tareas_estados`, `tareas_eventos` (usadas con `as any` en APIs). Hay que **aplicar migraciones** o crear objetos equivalentes en Supabase para que no fallen rutas.
- **Seguridad:** muchos handlers confían en **sesión** para saber el usuario, pero la **organización activa** a menudo viene de `**x-organizacion-id`** (mensajes, notificaciones, eventos, cuadrillas, límites, etc.). Eso es superficie de **IDOR** si no se valida que el usuario sea dueño de esa org.
- **Mocks:** existen flags `NEXT_PUBLIC_SOCIO_USE_MOCK` y similares; por defecto desactivados. Algunas demos (ej. presupuestos en UI) mencionan datos ficticios.

---

## 2. Tabla maestra (schema pegado vs código)

Leyenda de estado: **OK** alineado; **GAP** tabla/columna usada en código y ausente o dudosa en el export; **LEGACY** nombre o ruta alternativa; **RISK** seguridad o consistencia.


| Tabla Supabase (export)                   | Uso en código | Endpoints / servicios principales                                                                                 | Frontend / llamadas         | Estado                                                                                        |
| ----------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------- |
| `organizations`                           | Alta          | `app/api/orgs/*`, `lib/orgs.ts`, `app/api/obras/route.ts`, `app/api/tareas/route.ts`, webhooks auth, subscription | Onboarding cliente, paneles | **OK** (canónica)                                                                             |
| `organizaciones`                          | Fallback      | `plan.service.ts`, `permiso.service.ts`, `wallet/*`, `AhoraSection.tsx` (lectura nombre plan)                     | Vía servicios               | **LEGACY** — no está en tu export                                                             |
| `obras`                                   | Alta          | `app/api/obras/*`, componentes cliente/socio                                                                      | Creación/listado obras      | **OK**; validar POST vs GET misma fuente                                                      |
| `elementos`                               | Alta          | `app/api/obras/[id]/elementos/*`, seeds, CPM                                                                      | OrganizaSection, etc.       | **OK**                                                                                        |
| `tareas`                                  | Alta          | `app/api/tareas/*`, `lib/services/tarea*.ts`, transition, asignar                                                 | Cliente y socio             | **OK** + Prisma paralelo en `tarea.service.ts`                                                |
| `tareas_subtareas`                        | Alta          | APIs subtareas, `subtarea-mvp.service.ts`, validar bloque, AhoraSection                                           | Socio “Ahora”               | **OK**; estados subtarea vs tarea (ver §6)                                                    |
| `tareas_presupuestos`                     | Alta          | presupuestos, wallet, aprobar/rechazar                                                                            | Cliente/socio               | **OK**                                                                                        |
| `socios`                                  | Alta          | `app/api/socios/*`, wallet, tareas, permisos                                                                      | Agenda, QR, invitaciones    | **GAP** `user_id` / `public_codigo` usados en código; export sin `user_id` ni `public_codigo` |
| `cuadrillas` / `cuadrilla_socios`         | Media         | `app/api/cuadrillas/*`, asignar cuadrilla                                                                         | Cliente                     | **OK** — modelo “equipo”, no agenda                                                           |
| `eventos`                                 | Media         | `app/api/eventos/route.ts`, FSM, componentes                                                                      | Timeline / auditoría        | **OK**; header org                                                                            |
| `media`                                   | Media         | ligado a eventos / evidencias                                                                                     | AhoraSection                | **OK**                                                                                        |
| `wallet_saldos` / `wallet_movimientos`    | Media-Alta    | `wallet-mvp.service.ts`, `app/api/wallet/*`, pagar bloque                                                         | Billetera                   | **OK**; revisar duplicados subtarea (unique en migración repo)                                |
| `escrow_transacciones`                    | Media         | `escrow.service.ts`, webhook payments, checkout                                                                   | Pagos MP                    | **OK**                                                                                        |
| `jornadas_socio`                          | Media         | `AhoraSection`, `IniciarJornadaButton`, `socio/jornadas`                                                          | Socio                       | **OK**                                                                                        |
| `mensajes`                                | Media         | `app/api/mensajes/route.ts`                                                                                       | `MensajeriaSocio`           | **RISK** header org                                                                           |
| `notificaciones`                          | Media         | `app/api/notificaciones/*`                                                                                        | Headers / paneles           | **RISK** header org                                                                           |
| `documentos_legajo` / `categorias_legajo` | Baja-Media    | `lib/supabase/legajo.ts`, `app/api/legajo/*`                                                                      | Legajo obra                 | **OK**                                                                                        |
| `socio_suspensiones`                      | Baja          | definida en migración wallet; **casi sin uso directo** en TS fuera de `supabase.gen.ts`                           | Errores SOCIO_SUSPENDIDO    | **Dudosa en app** — suspensión vía `wallet_saldos.suspendido`                                 |
| `tarea_precedencias`                      | Media         | `OrganizaSection`, `AhoraSection`, APIs presupuesto/transition                                                    | CPM / grafo                 | **OK**                                                                                        |


### Tablas usadas en código y no listadas en tu export JSON


| Objeto                             | Uso                                                              |
| ---------------------------------- | ---------------------------------------------------------------- |
| `cliente_socio_agenda`             | `app/api/socios/agenda`, `lib/socios/agendar-socio.ts`           |
| `qr_tokens`                        | `mi-qr`, `agendar-socio`, `app/api/qr/resolve`, `cliente/lider`  |
| `public_codigo` (columna `socios`) | `mi-qr`, agendar por código                                      |
| `tareas_evidencias`                | `app/api/tareas/[id]/route.ts`, `ValidarSection`, `AhoraSection` |
| `tareas_estados`                   | `tarea-fsm.service.ts`, `tareas/route.ts`, `asignar-cuadrilla`   |
| `tareas_eventos`                   | `tarea-fsm.service.ts`                                           |


---

## 3. Tablas usadas de forma coherente

- `organizations`, `obras`, `elementos`, `tareas` (columnas alineadas con enum `tarea_estado_oficial` en export), `tareas_subtareas`, `tareas_presupuestos`, `eventos`, `media`, `wallet_*`, `escrow_transacciones`, `jornadas_socio`, `tarea_precedencias`, legajo.

---

## 4. Tablas dudosas o con doble significado

- `**cuadrilla_socios`:** agrupa socios en equipos para obras; **no** sustituye una agenda tipo contactos (el producto ya introduce `cliente_socio_agenda`).
- `**socios.org_id`:** hoy mezcla “socio dado de alta por la org” con “socio asignable”; para “socios libres” debe quedar **opcional** y las reglas de asignación deben pasar por **agenda** o por `responsable_socio_id` con validación de relación.
- `**socio_suspensiones`:** existe en DB (migración); la app reacciona a suspendido vía wallet, no tanto escribiendo esta tabla desde TS (verificar triggers en DB si los hay).

---

## 5. Tablas aparentemente poco usadas en aplicación

- `socio_suspensiones` (inserción no evidente en `apps/web`).
- `categorias_legajo` / `documentos_legajo` si el producto no expone legajo en todos los flujos (código sí existe).

---

## 6. Tablas en código que no existen en el export (riesgo runtime)

Ver tabla §2 “Tablas usadas en código…”. Sin estas tablas/columnas, fallan QR, agenda, FSM auxiliar o evidencias según ruta.

---

## 7. Problemas críticos

1. **Schema vs código:** faltan objetos (`cliente_socio_agenda`, `qr_tokens`, `public_codigo`, tablas FSM/evidencias) respecto al pegado del usuario → **errores 42P01 / PGRST204 / 42703** en producción si no se migró.
2. `**organizaciones` vs `organizations`:** código asume legacy; tu DB puede no tener `organizaciones` → fallbacks silenciosos o lógica incompleta en planes/permisos.
3. `**socios.user_id`:** varias rutas y `PermisoService` consultan `user_id`; comentarios en `invite` y `vincular-usuario` advierten que la columna puede no existir → **QR / permisos / wallet owner** inconsistentes.
4. **Headers `x-organizacion-id`:** riesgo de acceso horizontal sin validar pertenencia del usuario a la org.
5. **Service role:** la mayoría de APIs Supabase usan cliente de servicio; cualquier bug de autorización en el handler se amplifica.
6. **Estados `validada` vs `validado`:** a nivel **tarea** el enum oficial usa `validada`; en **subtareas** el código MVP usa `validado` / `para_validar` (convención distinta — ver `subtarea-mvp.service.ts` y seed). No es necesariamente bug si los enums de Postgres están alineados por tabla.
7. **Prisma:** rutas/servicios legacy pueden escribir en otro modelo; riesgo de **doble verdad** para tareas/presupuestos si aún se invoca.

---

## 8. Recomendación: modelo “Agenda de socios”

**Opción recomendada: C + A parcial.**

- **C) Tabla `cliente_socio_agenda`** (ya diseñada en migración del repo): el **cliente (org)** guarda referencia a `socio_id` agendado, con `metodo` y trazabilidad. Es el análogo a “contactos del teléfono”: la org no “posee” al socio global, solo **lo referencia**.
- **No reutilizar solo `cuadrilla_socios`** para agenda: semántica distinta (equipo de obra).
- `**socios.org_id`:** dejar **nullable** y dejar de exigir igualdad con org del cliente para asignar; en su lugar:
  - validar `EXISTS` en `cliente_socio_agenda` para esa `(org_id, socio_id)` **o**
  - aceptar `responsable_socio_id` si el socio es el perfil “global” vinculado por `user_id` al mismo usuario (caso borde).

Siguiente paso de producto (fuera de esta auditoría): ajustar endpoints `tareas` POST/asignar para usar agenda, no `org_id` del socio.

---

## 9. Recomendación: QR de socio

1. Asegurar en DB: `**socios.org_id` nullable**, `**public_codigo`** único sparse, tabla `**qr_tokens**` (`token`, `ref_id` = socio id, `scope`, `enabled`).
2. Asegurar `**socios.user_id**` → `auth.users(id)` para resolver perfil y permisos.
3. `/api/socios/mi-qr` hoy usa service role y tolera ausencia de `public_codigo`; si falta `**qr_tokens**`, el insert falla → migración obligatoria.

---

## 10. Recomendación: creación de obra “real”

- **Fuente principal:** `app/api/obras/route.ts` (POST/GET) con Supabase y campos `name`, `address`, `latitud`, `longitud`, `tipo_obra`, `propietario`, `superficies`, etc. Alinear el formulario cliente con ese contrato.
- Verificar que ningún flujo crítico dependa solo de Prisma para persistir obra nueva.
- Revisar que la org usada sea la de la sesión/metadata, no solo header sin validar.

---

## 11. Flujo actual más cercano a “funcionar”

1. Cliente con `organizations` + sesión Supabase crea **obra** y **elementos** via API Supabase.
2. Cliente crea **tareas** con `org_id` / `obra_id`.
3. **Asignación de socio** funciona cuando el socio tiene el **mismo `org_id`** (modelo actual); el modelo “agenda” aún requiere alinear reglas de backend.
4. Socio ve tareas en panel; **bloques** en `tareas_subtareas`; pagos vía presupuesto + wallet + escrow.

El cuello de botella para la reforma “socios libres” es **la validación de asignación por `org_id`**, no el nullable en DB.

---

## 12. Próximas tareas sugeridas (orden)

1. Aplicar en Supabase SQL Editor el bloque del **§14** (o migraciones equivalentes del repo).
2. Verificar existencia de `tareas_evidencias`, `tareas_estados`, `tareas_eventos` o sustituir por diseño unificado documentado.
3. Eliminar o aislar uso de `organizaciones` tras confirmar que la DB solo usa `organizations`.
4. Endurecer APIs: derivar `org_id` de sesión + membership; usar header solo como hint validado.
5. Refactor de asignación de tareas: chequeo `cliente_socio_agenda` en lugar de `socios.org_id = org cliente`.
6. Decidir retiro gradual de Prisma en servicios de tarea/suscripción o acotar a módulos no core (roadmap).

---

## 13. Entregable: SQL para SQL Editor (Supabase)

**Objetivo:** dejar alineado lo que el código ya espera: socios **sin obligación** de `org_id`, agenda, código público, tokens QR, y vínculo opcional auth ↔ socio.

> Ejecutar por partes si alguna sentencia ya fue aplicada. Revisar errores de “already exists”.

```sql
-- =============================================================================
-- A) Socio independiente de organización (org_id opcional)
-- =============================================================================
ALTER TABLE public.socios
  ALTER COLUMN org_id DROP NOT NULL;

-- =============================================================================
-- B) Vincular socio con usuario de Auth (opcional pero muy recomendado)
-- =============================================================================
ALTER TABLE public.socios
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_socios_user_id ON public.socios (user_id)
  WHERE user_id IS NOT NULL;

-- =============================================================================
-- C) Código público para agendar sin QR (8 caracteres alfanum)
-- =============================================================================
ALTER TABLE public.socios
  ADD COLUMN IF NOT EXISTS public_codigo text;

CREATE UNIQUE INDEX IF NOT EXISTS socios_public_codigo_unique
  ON public.socios (public_codigo)
  WHERE public_codigo IS NOT NULL;

-- =============================================================================
-- D) Tabla de tokens para QR de asociación / agenda
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.qr_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  ref_id uuid NOT NULL,
  scope text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qr_tokens_scope_ref
  ON public.qr_tokens (scope, ref_id)
  WHERE enabled = true;

-- =============================================================================
-- E) Agenda: qué organización (cliente) tiene agendado a qué socio
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.cliente_socio_agenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  socio_id uuid NOT NULL REFERENCES public.socios (id) ON DELETE CASCADE,
  source_socio_id uuid REFERENCES public.socios (id) ON DELETE SET NULL,
  metodo text NOT NULL CHECK (
    metodo IN ('qr', 'id_publico', 'email', 'telefono')
  ),
  estado text NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'pendiente')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, socio_id)
);

CREATE INDEX IF NOT EXISTS idx_cliente_socio_agenda_org
  ON public.cliente_socio_agenda (org_id);

CREATE INDEX IF NOT EXISTS idx_cliente_socio_agenda_created
  ON public.cliente_socio_agenda (org_id, created_at DESC);

-- =============================================================================
-- F) RLS (recomendado): ajustar políticas en el Editor según vuestro modelo.
--     El código usa service_role en muchas rutas; aun así conviene RLS para
--     clientes anon/authenticated si acceden directo a Supabase.
-- =============================================================================
-- ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY ... (definir con el equipo)

-- =============================================================================
-- G) Nota sobre tareas_evidencias / tareas_estados / tareas_eventos
--     Si las rutas FSM las referencian y no existen, generarlas o eliminar
--     dependencias en código en un PR aparte. No se incluye DDL aquí porque
--     depende del diseño ya desplegado en cada entorno.
-- =============================================================================
```

---

## 14. Checklist final para el PM


| Pregunta                          | Respuesta corta                                                                                                                                                        |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ¿Archivo creado?                  | `growslanding/grows_context/AUDITORIA_SUPABASE_USO_REAL.md`                                                                                                            |
| ¿Tablas analizadas?               | Las listadas en el pedido + `cliente_socio_agenda`, `qr_tokens`, tablas FSM/evidencias detectadas en código                                                            |
| ¿Hallazgos críticos?              | Objetos faltantes vs export; `organizaciones` legacy; `user_id`; headers org; Prisma paralelo                                                                          |
| ¿Próximo cambio real recomendado? | **Aplicar SQL §13** y luego **cambiar validación de asignación de tareas** para usar `cliente_socio_agenda` en lugar de igualar `socios.org_id` con la org del cliente |


---

*Documento generado en auditoría técnica; no implica cambios aplicados al repositorio ni a la base remota.*