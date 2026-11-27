# Prueba de usuarios sobre una obra existente

Opera exclusivamente `0deb686c-d97b-68a1-dbeb-ad413a6d394d`, Paseo del Jacarandá de ensayo, mediante el conector real de `https://growsapp2.vercel.app`. No crea otra obra ni inserta ofertas, avances o certificaciones directamente. Las identidades ficticias son Ana Torres, Delta, Litoral, Sur e Inés/Iván/Irene. El arquitecto tiene el permiso normal de coordinador aceptado; no se convierte en titular de la organización para aprobar acciones.

## Preparación administrativa

1. Aplicar `preparar-cuentas.sql` una vez. Solo prepara identidades y sus relaciones normales. No enviar emails a estos dominios `.invalid`.
2. Preparar autorizaciones temporales y aplicar el SQL resultante como administrador:

```sh
python scripts/ensayo-usuarios/preparar_autorizaciones.py --credentials work/usuarios.private.json --sql work/autorizar.sql
```

Las claves duran un día, quedan fuera de git y solo se guardan como hashes en el servidor. Para renovar, usar el mismo archivo de credenciales. Si se perdió, los IDs públicos de `identidades.json` permiten renovar las autorizaciones originales y conservar el historial idempotente; no contiene claves. Las operaciones de negocio nunca usan service-role. La preparación no concede permisos de pago ni de inversión.

## Ejecutar y continuar

```sh
python scripts/ensayo-usuarios/ejecutor.py leer --credentials work/usuarios.private.json
python scripts/ensayo-usuarios/ejecutor.py publicar --credentials work/usuarios.private.json
python scripts/ensayo-usuarios/ejecutor.py pasada --credentials work/usuarios.private.json
python scripts/ensayo-usuarios/ejecutor.py pasada --credentials work/usuarios.private.json
python scripts/ensayo-usuarios/ejecutor.py inversores --credentials work/usuarios.private.json
python scripts/ensayo-usuarios/ejecutor.py concurrencia --credentials work/usuarios.private.json
```

`pasada` lee las tareas publicadas, envía tres cotizaciones de ensayo diferentes para hormigonado, vuelve a leer las ofertas y prueba adjudicar la más económica. No confunde ARS con el presupuesto USD ni inventa conversión. Se detiene ante un bloqueo; no genera bloques ni certificaciones si no hay adjudicación válida. La adjudicación actual exige titular, mientras esta cuenta es coordinadora: el rechazo debe quedar visible.

Cada acción conserva un UUID estable. Un fallo incierto no se reejecuta con otro UUID. El cambio de clave `publicar-plan-v1` a `v2-fix-autenticacion` corresponde al 401 conocido y auditado sin mutación antes del arreglo, no a un reintento de resultado desconocido. La segunda pasada omite acciones ya intentadas y consulta el estado real. Los rechazos esperados de permisos se distinguen de fallos del producto. Un bulk con errores por elemento no se aprueba por tener HTTP 200.

Si falta el estado local, recupera el checkpoint auditado `docs/ensayos/2026-11-27-continuidad.json` y vuelve a leer el estado del producto antes de actuar. Estado: `work/ensayo-usuarios/continuidad.json`; evidencias: `acciones.jsonl`, lecturas y comparación en el mismo directorio. El bloqueo de archivo impide dos ejecuciones locales superpuestas. Las claves no se incluyen en estas evidencias.

```sh
python scripts/ensayo-usuarios/ejecutor.py pausar --credentials work/usuarios.private.json
python scripts/ensayo-usuarios/ejecutor.py reanudar --credentials work/usuarios.private.json
python -m unittest discover -s scripts/ensayo-usuarios -p 'test_*.py'
```

## Alcance y programación

Este ejecutor es manual y persistente en el host que lo ejecute. **No se presenta como programador remoto activo.** El cron anterior de carga por plantillas sigue siendo independiente. No reemplazarlo ni anunciar simulación integral automática hasta resolver los bloqueos y alojar este ejecutor con estado duradero y renovación segura de credenciales. No se ejecutan pagos, emisión de MCU ni inversiones inexistentes.

Al terminar, revocar únicamente las autorizaciones `Ensayo usuarios 2026-11-27` de los siete usuarios con `raw_user_meta_data.fixture = grows-ensayo-usuarios-v1`; conservar cuentas y evidencia para poder retomar. No borrar la obra ni datos ajenos. No publicar claves ni subir `work/` a git.
