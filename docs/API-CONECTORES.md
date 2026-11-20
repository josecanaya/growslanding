# API de GROWS y conectores externos

Fecha de implementación: 20/11/2026. Esta entrega permite operar GROWS desde una aplicación o un asistente externo. No integra un modelo de lenguaje, no entrena uno ni necesita claves de OpenAI o Anthropic.

## Portal

- Documentación interactiva: `/api/docs`.
- Especificación OpenAPI 3.1: `/api/v1/openapi`.
- Catálogo de operaciones del conector: `/api/v1/catalogo`.
- Autorizaciones y claves personales: `/conexiones`.
- MCP remoto, Streamable HTTP: `/api/mcp`.

El portal sigue la estructura del referente de Bimtrazer: menú por servicios, operaciones, método/ruta, campos, ejemplos y respuestas. Está implementado en la aplicación, sin depender de un script externo para renderizar la documentación. La consola de prueba llama a los endpoints reales; no hay resultados simulados. La clave introducida se mantiene solo en memoria de la pestaña.

Servicios: Comunidad, Obras, Proyecto, Planificación, Publicaciones, Rondas, Contratistas, Contratación, Ejecución y Certificación técnica en obra. El catálogo y OpenAPI se generan desde el registro de operaciones y sus contratos; las rutas REST y las herramientas MCP terminan en los mismos handlers que usa la aplicación.

## Identidad y permisos

La conexión actúa como un usuario existente. No recibe privilegios administrativos por ser una IA. Cada autorización queda ligada a un usuario, una organización opcional y permisos seleccionados:

| Permiso | Alcance |
| --- | --- |
| grows:public | Feed, perfiles públicos y participación como el propio usuario |
| grows:read | Proyecto privado, planificación y cotizaciones; responsable/coordinador |
| grows:plan | Alta de obra, canvas, pliegos y contratación según permisos del servicio |
| grows:publish | Presentación pública, novedades y obras hermanas |
| grows:rounds | Primera ronda de ensayo y adicionales |
| grows:work | Cotizaciones, bloques, evidencias y revisión técnica según asignación/rol |

Se vuelve a comprobar la identidad actual, pertenencia a la organización y rol. Un contratista no obtiene permisos de proyectista por enviar `actor` o `user_id`. El usuario de las rutas proviene de un contexto de petición aislado con AsyncLocalStorage, instalado solo después de verificar el token; las sesiones normales de navegador conservan su autenticación original. Los handlers y servicios mantienen sus validaciones, estados y restricciones. Los IDs de obra/tarea/bloque/oferta se comprueban contra la organización de la autorización antes de despachar.

La organización de una obra nueva viene de la autorización, no de un campo elegido por el modelo. El alcance congelado sigue protegido por la base de datos. No hay herramientas para ejecutar SQL, administrar cuentas ajenas, conceder permisos o hacer pagos.

## REST

Se documentan las rutas de recursos con GET, POST y PUT. Ejemplos:

```text
GET  /api/v1/obras
POST /api/v1/obras
GET  /api/v1/obras/{id}/canvas
PUT  /api/v1/obras/{id}/canvas
POST /api/v1/obras/{id}/plan
POST /api/v1/obras/{id}/rondas
POST /api/v1/obras/{id}/novedades
PUT  /api/v1/tareas/{id}/estado
POST /api/v1/bloques/{id}/presentacion
POST /api/v1/bloques/{id}/revision
```

Autenticación: `Authorization: Bearer <clave personal GROWS o access token OAuth>`.
Escrituras: `Idempotency-Key: <UUID>`. El cuerpo sigue el contrato publicado en OpenAPI. Para un documento completo, leer primero y conservar sus campos e identificadores.

También está disponible `POST /api/v1/operaciones/{nombre}` para clientes que prefieren las operaciones del MCP. En ese formato los argumentos siguen el esquema MCP y el UUID se envía como `request_id`.

Las respuestas usan `status`, `request_id`, `replayed` y `data`; data conserva la respuesta del servicio real. Hay solicitudes inválidas, roles insuficientes, estados bloqueados y servicios incompletos que deben corregirse; la API no convierte un fallo de producto en un éxito ficticio.

Cada conexión admite 30 invocaciones por minuto. Se serializa la reserva de la solicitud, se almacena su hash y se conserva el resultado. Un UUID repetido con el mismo contenido devuelve el resultado anterior; con otro contenido devuelve conflicto. Un timeout antes de registrar el resultado deja `en_curso` y no reejecuta automáticamente la acción: se debe revisar el estado real. Los 5xx quedan `incierto`; las respuestas parciales quedan identificadas. Esto evita duplicar operaciones heredadas que todavía no son transaccionales de punta a punta.

## Conexión sin CLI

1. En Claude o ChatGPT, agregar un servidor MCP remoto con la URL pública `/api/mcp`.
2. Elegir OAuth y registro automático del cliente (DCR), o registrar un cliente compatible desde la configuración del proveedor.
3. Ingresar en GROWS y seleccionar organización/permisos en la pantalla de consentimiento.
4. Revisar o revocar la autorización en `/conexiones`.

No se modifica automáticamente la configuración de las cuentas externas del usuario. La disponibilidad y los nombres de los menús dependen del cliente y plan. Si el cliente solo admite API Key, generar una clave personal desde GROWS y usarla como Bearer. Nunca pegar claves en publicaciones o conversaciones.

Endpoints OAuth:

```text
GET  /.well-known/oauth-protected-resource
GET  /.well-known/oauth-protected-resource/api/mcp
GET  /.well-known/oauth-authorization-server
POST /api/conectores/oauth/registrar
GET  /conectar
POST /api/conectores/oauth/autorizar
POST /api/conectores/oauth/token
POST /api/conectores/oauth/revocar
```

Authorization Code con PKCE S256 obligatorio, callback registrado exacto, audiencia/recurso ligado al MCP, códigos de un uso de 5 minutos y access tokens de hasta una hora. Refresh tokens rotan; el reuso revoca la autorización. Las autorizaciones OAuth duran hasta 30 días. Las claves personales duran entre 1 y 30 días. Los códigos, secretos de cliente, access y refresh tokens solo se guardan como hashes SHA-256. La página de administración permite hasta 30 conexiones activas por usuario. El registro público de clientes tiene límites globales.

Se admiten clientes públicos (`none`) y secretos por `client_secret_post` / `client_secret_basic`. No se anuncian Client ID Metadata Documents ni private_key_jwt: en los clientes que los priorizan, seleccionar registro automático o un cliente OAuth compatible. No se aceptan callbacks HTTP ni loopback en esta etapa; el objetivo son clientes remotos web.

## Compatibilidad

La clave compartida histórica `GROWS_MCP_TOKEN` conserva las herramientas antiguas y el límite de `GROWS_MCP_ORG_ID`; no se amplían sus poderes. Para acceder al nuevo catálogo se requiere una autorización individual. La integración anterior puede seguir funcionando sin migración inmediata, pero no representa la identidad de cada usuario.

Se retiró el acceso al chat/agente integrado del espacio principal de obra y se reemplazó por Conexiones. El código previo no se reescribe ni se elimina; esta primera etapa trabaja con asistentes externos.

## Despliegue

Aplicar `deploy/connectors.sql` después de las migraciones de canvas, estudio y rondas existentes. Reutiliza la configuración Supabase del servidor y no agrega credenciales de modelos. Las nuevas tablas tienen RLS activo y acceso directo denegado a anon/authenticated; las rutas del servidor realizan la autorización antes de usar los servicios.

URL canónica predeterminada: `https://growsapp2.vercel.app`. Para otro despliegue, definir `GROWS_CONNECTOR_URL` con su origen HTTPS antes de crear clientes o autorizaciones. Los tokens emitidos para otro recurso se rechazan. No usar el dominio vencido.

La documentación es pública. El consentimiento verifica la sesión y las operaciones requieren token; incluir `/api/docs` y `/conectar` en las rutas que no redirige el guard global del cliente no concede acceso a datos privados.

## Validación

- Suite focalizada de autenticación, scopes, aislamiento entre peticiones, MCP HTTP real con SDK, PKCE, contratos OpenAPI, documentación y regresiones de estudio/publicación.
- Prueba transaccional en PostgreSQL: PKCE incorrecto rechazado, código consumido una sola vez, refresh rotado y revocación por reuso, reserva idempotente y conflicto al cambiar el contenido. Sus datos se revirtieron al finalizar.
- El flujo completo de consentimiento dentro de las cuentas de Claude y ChatGPT requiere autorizar la conexión en esas aplicaciones. No se presenta como verificado por las pruebas de servidor.

## Límites del producto

No se exponen recepción de dinero, transferencias, emisión/venta de MCU, derechos de inversión pendientes ni validación final de bloques con liquidación de wallet. La revisión técnica permite `validar_en_obra` o `rechazar`. Las rondas son de ensayo y los adicionales no abren automáticamente una segunda ronda. Los endpoints antiguos incompletos o deprecated no se publican como nuevas capacidades.

Referencias de interoperabilidad: https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization y documentación oficial de conectores de los clientes.
