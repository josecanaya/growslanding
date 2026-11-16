#!/usr/bin/env node
// Verificación en navegador (Chromium real) de los recorridos principales de cada rol sobre la app de pruebas.
// Cada actor inicia sesión por el formulario de /auth/login y opera con clics; no se usa la API directa
// salvo para preparar la obra (escenario «navegador»). Deja capturas y un informe en docs/evidencia/navegador/.
//   node scripts/simulacion/navegador.mjs [--salida docs/evidencia/navegador]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { admin, cargarEntorno, RAIZ } from '../entorno-pruebas/entorno.mjs';
import { abrirDiario, abrirSesiones, ejecutarEscenario, leerJson, rutaEstado, version } from './motor.mjs';
import escenario from './escenarios/navegador.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const entorno = cargarEntorno();
const iSalida = process.argv.indexOf('--salida');
const salida = resolve(RAIZ, iSalida > 0 ? process.argv[iSalida + 1] : 'docs/evidencia/navegador');
mkdirSync(salida, { recursive: true });
const identidades = JSON.parse(readFileSync(entorno.identidades, 'utf8'));

// Preparación: obra nueva cada vez (se limpia la anterior con acceso administrativo).
const previo = leerJson(rutaEstado('navegador'), null);
if (previo?.vars?.obra) await admin(entorno).rpc('sim_limpiar_obra', { p_obra: previo.vars.obra });
const { rmSync } = await import('node:fs');
rmSync(rutaEstado('navegador'), { force: true });
const corridaId = `navegador-${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}`;
const prep = await ejecutarEscenario(escenario, { entorno, sesiones: abrirSesiones(entorno), corrida: corridaId, semilla: 1, hastaDia: 0, registrar: abrirDiario(corridaId).registrar });
if (!prep.completo) { console.error('No se pudo preparar la obra de navegador'); process.exit(1); }
const obra = prep.obra;

const pasos = [];
const browser = await chromium.launch();
let n = 0;
async function comoActor(clave, fn) {
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 }, locale: 'es-AR' });
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const paso = async (nombre, accion) => {
    const id = String(++n).padStart(2, '0');
    try {
      const detalle = await accion();
      const archivo = `${id}-${clave}-${nombre.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').slice(0, 50)}.png`;
      await page.screenshot({ path: resolve(salida, archivo), fullPage: true });
      pasos.push({ n: id, actor: clave, paso: nombre, resultado: 'aprobado', url: page.url().replace(entorno.web, ''), captura: archivo, detalle: detalle ?? null });
      console.log(`  ✓ ${id} ${clave.padEnd(12)} ${nombre}`);
    } catch (e) {
      await page.screenshot({ path: resolve(salida, `${id}-${clave}-FALLO.png`), fullPage: true }).catch(() => {});
      pasos.push({ n: id, actor: clave, paso: nombre, resultado: 'fallido', url: page.url().replace(entorno.web, ''), captura: `${id}-${clave}-FALLO.png`, detalle: e.message.split('\n')[0] });
      console.log(`  ✗ ${id} ${clave.padEnd(12)} ${nombre} → ${e.message.split('\n')[0]}`);
      throw e;
    }
  };
  try {
    if (clave !== 'anonimo') {
      await paso('Iniciar sesión por el formulario', async () => {
        // El auditor no tiene rol operativo: entra por el enlace «Ingresar» de la pantalla del circuito (login con retorno).
        await page.goto(`${entorno.web}/auth/login${clave === 'auditor' ? `?redirect=${encodeURIComponent(`/obras/${obra}/circuito`)}` : ''}`);
        await page.fill('input[type="email"]', identidades[clave].email);
        await page.fill('input[type="password"]', identidades[clave].password);
        await page.click('button[type="submit"]');
        await page.waitForURL((u) => !u.pathname.startsWith('/auth/login'), { timeout: 30000 });
        return { destino: new URL(page.url()).pathname };
      });
    }
    await fn(page, paso);
  } catch { /* el paso fallido ya quedó registrado */ }
  finally { if (errores.length) pasos.push({ n: '--', actor: clave, paso: 'errores de JavaScript en la página', resultado: 'fallido', detalle: errores.slice(0, 3).join(' | ') }); await ctx.close(); }
}
const texto = (page, t) => page.getByText(t, { exact: false }).first().waitFor({ timeout: 20000 });
const circuito = `${entorno.web}/obras/${obra}/circuito`;
const evidencia = (nombre, contenido) => ({ name: nombre, mimeType: 'text/plain', buffer: Buffer.from(contenido) });

console.log(`Verificación en navegador · obra ${obra}`);
await comoActor('anonimo', async (page, paso) => {
  await paso('Feed público muestra la obra y la ficha de inversión sin sesión', async () => {
    await page.goto(`${entorno.web}/inversores`);
    await page.getByRole('link', { name: /Casa Navegador/ }).first().click();
    // El selector de mirada se activa al hidratar la página: se reintenta hasta que quede marcado.
    const mirada = page.getByRole('button', { name: 'Inversor' });
    for (let i = 0; i < 20 && (await mirada.getAttribute('aria-pressed')) !== 'true'; i++) { await mirada.click(); await page.waitForTimeout(500); }
    await page.getByTestId('aporte-minimo').waitFor({ timeout: 20000 });
    await texto(page, 'Condiciones de salida'); await texto(page, 'Destino de los fondos'); await texto(page, 'Ingresar para suscribir');
    return { aporte_minimo: await page.getByTestId('aporte-minimo').innerText() };
  });
  await paso('Circuito interno de la obra exige sesión', async () => {
    await page.goto(circuito);
    // Sin sesión, la app muestra el aviso de ingreso o redirige al login (según qué resuelva primero); nunca muestra datos.
    await Promise.race([texto(page, 'Iniciá sesión para continuar'), page.waitForURL((u) => u.pathname.startsWith('/auth/login'), { timeout: 20000 })]);
    if (await page.getByTestId('circuito-obra').count()) throw new Error('el circuito se mostró sin sesión');
    return { destino: new URL(page.url()).pathname };
  });
});
await comoActor('inversor1', async (page, paso) => {
  await paso('Entrar por el feed y suscribir 20 MCU', async () => {
    await page.goto(`${entorno.web}/inversores?obra=${obra}&vista=inversor`);
    await page.getByTestId('ronda').waitFor({ timeout: 20000 });
    await page.fill('#mcu', '20');
    const monto = await page.getByTestId('monto-suscripcion').innerText();
    await page.getByRole('button', { name: 'Suscribir' }).click();
    await texto(page, 'Suscripción registrada');
    return { monto };
  });
  await paso('Integrar la suscripción', async () => {
    await page.getByRole('button', { name: 'Integrar' }).click();
    await texto(page, 'queda en custodia');
    await page.locator('[data-testid="mi-posicion"] [data-estado="integrada"]').waitFor();
  });
  await paso('Mi posición muestra el estado de los fondos', async () => {
    await page.goto(`${entorno.web}/inversores/posicion`);
    await page.getByTestId('posicion-inversor').waitFor({ timeout: 20000 });
    await texto(page, 'En custodia de rondas');
    return { saldo: await page.getByTestId('saldo').innerText() };
  });
  await paso('El inversor no accede al circuito interno', async () => { await page.goto(circuito); await texto(page, 'No tenés acceso'); });
});
await comoActor('contratista3', async (page, paso) => {
  await paso('Ver el alcance recibido y enviar oferta', async () => {
    await page.goto(`${entorno.web}/socio/circuito`);
    const tarjeta = page.getByTestId('obra-contratista').filter({ hasText: 'Casa Navegador' });
    await tarjeta.waitFor({ timeout: 30000 });
    await tarjeta.getByText('Niveles ±1 cm').waitFor();
    await tarjeta.getByLabel('Precio unitario N-01').fill('505');
    await tarjeta.getByLabel('Plazo (días)').fill('14');
    await tarjeta.getByRole('button', { name: 'Enviar oferta' }).click();
    await tarjeta.getByText('Oferta enviada sobre la revisión 1').waitFor({ timeout: 20000 });
  });
});
await comoActor('arquitecto', async (page, paso) => {
  await paso('Pliego publicado con todos los campos por partida', async () => {
    await page.goto(circuito);
    await page.getByTestId('seccion-pliego').waitFor({ timeout: 30000 });
    await texto(page, 'Criterio de aceptación'); await texto(page, 'N-PLAT');
  });
  await paso('Planificación: línea base, ruta crítica y curva S', async () => {
    await page.getByRole('button', { name: 'Planificación' }).click();
    await page.getByTestId('curva-s').waitFor();
    return { ruta_critica: await page.getByTestId('ruta-critica').innerText() };
  });
  await paso('Comparar tres ofertas y adjudicar', async () => {
    await page.getByRole('button', { name: 'Cotizaciones' }).click();
    const filas = page.locator('[data-testid="solicitud"] tbody tr');
    if (await filas.count() !== 3) throw new Error(`se esperaban 3 ofertas y hay ${await filas.count()}`);
    await filas.filter({ hasText: 'Hormigones Delta' }).getByRole('button', { name: 'Adjudicar' }).click();
    await texto(page, 'las tareas del contrato quedaron publicadas');
    await page.getByTestId('contrato').waitFor();
  });
  await paso('Cerrar la ronda y ver la caja', async () => {
    await page.getByRole('button', { name: 'Financiación' }).click();
    await page.getByRole('button', { name: 'Cerrar ronda' }).click();
    await texto(page, 'Ronda cerrada');
    return { caja: await page.getByTestId('caja').innerText() };
  });
});
await comoActor('contratista1', async (page, paso) => {
  await paso('Informar avance de la tarea habilitada con evidencia', async () => {
    await page.goto(`${entorno.web}/socio/circuito`);
    const tarjeta = page.getByTestId('obra-contratista').filter({ hasText: 'Casa Navegador' });
    const tarea = tarjeta.locator('[data-testid="tarea"][data-habilitada="true"]');
    await tarea.waitFor({ timeout: 30000 });
    await tarea.getByLabel('Avance N-PLAT').fill('100');
    await tarea.locator('input[type="file"]').setInputFiles(evidencia('fotos-platea.txt', 'Fotos fechadas de la platea'));
    await tarea.getByRole('button', { name: 'Informar avance' }).click();
    await tarjeta.locator('[data-testid="avance-abierto"]').waitFor({ timeout: 20000 });
  });
});
await comoActor('arquitecto', async (page, paso) => {
  await paso('Aceptar el avance con evidencia', async () => {
    await page.goto(circuito);
    await page.getByRole('button', { name: 'Certificaciones' }).click();
    await page.getByTestId('avance-pendiente').getByRole('button', { name: 'Aceptar' }).click();
    await texto(page, 'Avance aceptado');
  });
});
await comoActor('contratista1', async (page, paso) => {
  await paso('Presentar el certificado con evidencia', async () => {
    await page.goto(`${entorno.web}/socio/circuito`);
    const tarjeta = page.getByTestId('obra-contratista').filter({ hasText: 'Casa Navegador' });
    await tarjeta.getByLabel('Porcentaje N-01').fill('100');
    await tarjeta.getByTestId('contrato').locator('input[type="file"]').setInputFiles(evidencia('acta-sin-firma.txt', 'Acta de medición sin firma'));
    await tarjeta.getByRole('button', { name: 'Presentar' }).click();
    await tarjeta.locator('[data-testid="certificado"] [data-estado="presentado"]').waitFor({ timeout: 20000 });
  });
});
await comoActor('arquitecto', async (page, paso) => {
  await paso('Rechazar el certificado con motivo', async () => {
    await page.goto(circuito);
    await page.getByRole('button', { name: 'Certificaciones' }).click();
    const cert = page.getByTestId('certificado');
    await cert.getByLabel('Motivo del rechazo').fill('El acta no está firmada.');
    await cert.getByRole('button', { name: 'Rechazar' }).click();
    await cert.locator('[data-estado="rechazado"]').waitFor({ timeout: 20000 });
  });
});
await comoActor('contratista1', async (page, paso) => {
  await paso('Corregir la observación y volver a presentar', async () => {
    await page.goto(`${entorno.web}/socio/circuito`);
    const cert = page.getByTestId('obra-contratista').filter({ hasText: 'Casa Navegador' }).getByTestId('certificado');
    await cert.getByText('El acta no está firmada.').waitFor({ timeout: 30000 });
    await cert.locator('input[type="file"]').setInputFiles(evidencia('acta-firmada.txt', 'Acta de medición firmada'));
    await cert.getByRole('button', { name: 'Corregir y volver a presentar' }).click();
    await cert.locator('[data-estado="presentado"]').waitFor({ timeout: 20000 });
  });
});
await comoActor('arquitecto', async (page, paso) => {
  await paso('Aprobar y pagar el certificado corregido', async () => {
    await page.goto(circuito);
    await page.getByRole('button', { name: 'Certificaciones' }).click();
    const cert = page.getByTestId('certificado');
    await cert.getByRole('button', { name: 'Aprobar' }).click();
    await cert.locator('[data-estado="aprobado"]').waitFor({ timeout: 20000 });
    await cert.getByRole('button', { name: /^Pagar/ }).click();
    await cert.locator('[data-estado="pagado"]').waitFor({ timeout: 20000 });
    return { historial: (await cert.getByTestId('historial').innerText()).split('\n').map((l) => l.split('·').pop().trim()) };
  });
});
await comoActor('auditor', async (page, paso) => {
  await paso('El auditor relee el circuito en solo lectura', async () => {
    await page.goto(circuito);
    await page.locator('[data-testid="circuito-obra"][data-rol="auditor"]').waitFor({ timeout: 30000 });
    await page.getByRole('button', { name: 'Certificaciones' }).click();
    await page.getByTestId('certificado').locator('[data-estado="pagado"]').waitFor();
    if (await page.getByRole('button', { name: /Aprobar|Pagar|Adjudicar|Cerrar ronda/ }).count()) throw new Error('el auditor ve botones de escritura');
  });
});
await comoActor('inversor1', async (page, paso) => {
  await paso('El inversor ve el avance verificado y su posición asignada', async () => {
    await page.goto(`${entorno.web}/inversores?obra=${obra}&vista=inversor`);
    await page.getByTestId('mi-posicion').waitFor({ timeout: 30000 });
    const mcu = await page.getByTestId('mis-mcu').innerText();
    if (mcu.trim() !== '20') throw new Error(`posición inesperada: ${mcu}`);
    await texto(page, 'Avance verificado');
    return { mcu };
  });
});
await browser.close();

const ok = pasos.every((p) => p.resultado === 'aprobado');
const informe = { generado_at: new Date().toISOString(), version: version(), instancia: entorno.web, obra, navegador: 'Chromium (Playwright)', resultado: ok ? 'aprobado' : 'fallido', pasos };
writeFileSync(resolve(salida, 'informe.json'), JSON.stringify(informe, null, 2));
writeFileSync(resolve(salida, 'informe.md'), `# Verificación en navegador\n\n- Generado: ${informe.generado_at}\n- Versión: \`${informe.version}\`\n- Instancia: ${informe.instancia} (build de producción, middleware de autenticación activo)\n- Obra: \`${obra}\`\n- Resultado: **${informe.resultado}** (${pasos.filter((p) => p.resultado === 'aprobado').length}/${pasos.length})\n\n| # | Actor | Paso | Resultado | Captura | Detalle |\n|---|---|---|---|---|---|\n${pasos.map((p) => `| ${p.n} | ${p.actor} | ${p.paso} | ${p.resultado === 'aprobado' ? '✅' : '❌'} | ${p.captura ? `[${p.captura}](${p.captura})` : ''} | ${p.detalle ? '`' + JSON.stringify(p.detalle).slice(0, 160) + '`' : ''} |`).join('\n')}\n`);
console.log(`\n${ok ? 'APROBADO' : 'FALLIDO'} · informe en ${salida}/informe.md`);
process.exit(ok ? 0 : 1);
