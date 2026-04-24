# QA_CREDENTIALS_REQUIRED — Cuentas y secretos (sin valores reales)

**Propósito:** listar qué identidades y claves hacen falta para desbloquear el E2E completo, sin escribir contraseñas en el repositorio.

---

## 1. Cuentas de aplicación (Supabase Auth)

| ID interno (documentación) | Rol esperado en negocio | Cómo crear | Qué vincular en DB |
|----------------------------|-------------------------|------------|-------------------|
| `QA_USER_CLIENTE` | Cliente / arquitecto (dueño de org) | Supabase Dashboard → Authentication → Add user, o flujo de signup del proyecto + confirmar email | `organizations.user_id` = `QA_USER_CLIENTE` |
| `QA_USER_SOCIO` | Socio ejecutor | Idem, usuario distinto al cliente | Fila en `socios`: `user_id` = `QA_USER_SOCIO`, `org_id` = org del cliente |
| `QA_USER_ADMIN` (opcional) | Admin global | Solo si se prueba módulo admin / políticas que lo exijan | Según `app_metadata` / RLS del proyecto; documentar si se usa |

**Reglas:**

- Misma **zona horaria y proyecto Supabase** que el entorno de prueba (clave `NEXT_PUBLIC_SUPABASE_URL` del `apps/web/.env.local` de staging).
- Emails **únicos** y en dominio controlado (p. ej. `+qa` o subdominio de prueba).
- No reutilizar cuentas personales de producción.

---

## 2. Valores a guardar en un sitio seguro (fuera del repo)

| Nombre / concepto | Uso |
|-------------------|-----|
| Contraseñas o magic links de los usuarios QA | Login manual E2E |
| `SUPABASE_SERVICE_ROLE_KEY` (solo entorno de staging) | `seed:demo` y SQL de corrección de vínculos |
| `MP_WEBHOOK_SECRET` (staging) | Prueba del webhook con header de secreto |
| Credenciales MercadoPago de **sandbox** (si se prueba pago end-to-end) | `getPaymentInfo` en el webhook usa API MP según `lib/payments/mercadopago` |

---

## 3. Metadatos de rol (si el proyecto depende de JWT)

Algunas rutas históricas leen `user.app_metadata.role` o `user_metadata.role` (p. ej. `CLIENTE_TECNICO`). Para el E2E **mínimo** del core, lo imprescindible es la vinculación en tablas `organizations` / `socios`.  
Si al probarse aparece 403 inesperado, revisar en Supabase el usuario y alinear metadatos con la convención del proyecto (documentar en el informe de esa corrida, sin cambiar lógica core salvo bug bloqueante).

---

## 4. Checklist previo a ejecutar E2E

- [ ] Usuario `QA_USER_CLIENTE` creado y puede iniciar sesión en `{{BASE_URL}}`.
- [ ] Usuario `QA_USER_SOCIO` creado y puede iniciar sesión.
- [ ] `organizations.user_id` apunta al cliente.
- [ ] `socios.user_id` apunta al socio y `socios.org_id` a la org correcta.
- [ ] Emails de `socios` coinciden con el login del socio (útil para flujos que comparan `tarea.responsable` con email).
- [ ] (Opcional) `QA_USER_ADMIN` creado solo si el alcance E2E lo incluye.

---

## 5. Qué pega este documento con `QA_SEED_PLAN.md`

- El plan de datos explica **qué** insertar.  
- Este documento explica **qué identidades** deben existir en Auth y **cómo enlazarlas** sin comprometer el repositorio con secretos.
