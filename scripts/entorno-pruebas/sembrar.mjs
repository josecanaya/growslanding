#!/usr/bin/env node
// Preparación ADMINISTRATIVA de la instancia de pruebas (idempotente):
//   · 9 identidades ficticias @grows.test con contraseña local aleatoria
//   · organización de la arquitecta, perfiles de contratista, agenda vacía (la arma la arquitecta por la API)
//   · saldo ficticio de los inversores y bucket privado de evidencias
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { admin, cargarEntorno } from './entorno.mjs';

const entorno = cargarEntorno();
const a = admin(entorno);
export const IDENTIDADES = [
  { clave: 'arquitecto', email: 'ana.arquitecta@grows.test', nombre: 'Ana Ríos (arquitecta ficticia)', rol: 'CLIENTE_TECNICO' },
  { clave: 'contratista1', email: 'hormigones.delta@grows.test', nombre: 'Hormigones Delta SRL (ficticia)', rol: 'SOCIO', especialidad: 'Estructura' },
  { clave: 'contratista2', email: 'instalaciones.litoral@grows.test', nombre: 'Instalaciones Litoral (ficticia)', rol: 'SOCIO', especialidad: 'Instalaciones' },
  { clave: 'contratista3', email: 'terminaciones.sur@grows.test', nombre: 'Terminaciones Sur (ficticia)', rol: 'SOCIO', especialidad: 'Terminaciones' },
  { clave: 'inversor1', email: 'ines.inversora@grows.test', nombre: 'Inés Vera (inversora ficticia)', rol: null, deposito: 900000 },
  { clave: 'inversor2', email: 'ivan.inversor@grows.test', nombre: 'Iván Paz (inversor ficticio)', rol: null, deposito: 600000 },
  { clave: 'inversor3', email: 'irene.inversora@grows.test', nombre: 'Irene Sosa (inversora ficticia)', rol: null, deposito: 400000 },
  { clave: 'coordinador', email: 'carla.coordinadora@grows.test', nombre: 'Carla Méndez (coordinadora ficticia)', rol: null },
  { clave: 'auditor', email: 'aldo.auditor@grows.test', nombre: 'Aldo Luna (auditor ficticio)', rol: null },
];

const previas = existsSync(entorno.identidades) ? JSON.parse(readFileSync(entorno.identidades, 'utf8')) : {};
const usuarios = (await a.pedir('/auth/v1/admin/users?per_page=200')).users;
const salida = {};
for (const ident of IDENTIDADES) {
  const password = previas[ident.clave]?.password ?? randomBytes(12).toString('base64url');
  let user = usuarios.find((u) => u.email === ident.email);
  const perfil = ident.clave.startsWith('inversor') ? 'inversor' : ident.rol === 'SOCIO' ? 'contratista' : ident.rol ? 'profesional' : undefined;
  const meta = {
    password, email_confirm: true,
    app_metadata: ident.rol ? { role: ident.rol, roles: [ident.rol] } : {},
    user_metadata: { full_name: ident.nombre, ficticio: true, ...(ident.rol ? { role: ident.rol } : {}), ...(perfil ? { grows_feed_profile: perfil } : {}) },
  };
  user = user
    ? await a.pedir(`/auth/v1/admin/users/${user.id}`, { method: 'PUT', body: JSON.stringify(meta) })
    : await a.pedir('/auth/v1/admin/users', { method: 'POST', body: JSON.stringify({ email: ident.email, ...meta }) });
  salida[ident.clave] = { id: user.id, email: ident.email, password, nombre: ident.nombre };
  if (ident.rol === 'CLIENTE_TECNICO') {
    await a.upsert('organizations', [{ id: user.id, name: 'Estudio Ríos (ficticio)', user_id: user.id, plan_actual: 'PRO' }], 'id');
    await a.pedir(`/auth/v1/admin/users/${user.id}`, { method: 'PUT', body: JSON.stringify({ user_metadata: { ...meta.user_metadata, org_id: user.id } }) });
    salida[ident.clave].org_id = user.id;
  }
  if (ident.rol === 'SOCIO') {
    await a.upsert('socios', [{ id: user.id, user_id: user.id, nombre: ident.nombre, email: ident.email, especialidad: ident.especialidad, estado: 'activo' }], 'id');
    salida[ident.clave].socio_id = user.id;
  }
  if (ident.deposito) {
    // ref_id estable (= id del usuario): el depósito ficticio existe una sola vez aunque se vuelva a sembrar.
    await a.pedir('/rest/v1/inversor_cuenta_movimientos?on_conflict=user_id,tipo,ref_id', { method: 'POST',
      headers: { Prefer: 'resolution=ignore-duplicates' },
      body: JSON.stringify([{ user_id: user.id, tipo: 'deposito_ficticio', monto: ident.deposito, ref_id: user.id, descripcion: 'Saldo ficticio inicial de ensayo' }]) });
  }
}
const buckets = await a.pedir('/storage/v1/bucket');
if (!buckets.some((b) => b.id === 'evidencias-obra')) {
  await a.pedir('/storage/v1/bucket', { method: 'POST', body: JSON.stringify({ id: 'evidencias-obra', name: 'evidencias-obra', public: false }) });
}
writeFileSync(entorno.identidades, JSON.stringify(salida, null, 2));
console.log(`Sembradas ${Object.keys(salida).length} identidades ficticias y el bucket evidencias-obra.`);
for (const [clave, v] of Object.entries(salida)) console.log(`  ${clave.padEnd(13)} ${v.email.padEnd(36)} ${v.id}`);
