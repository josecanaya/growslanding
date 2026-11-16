#!/usr/bin/env node
// Reconstruye una línea base del esquema `public` a partir de los tipos generados
// (apps/web/lib/types/supabase.gen.ts). El repositorio no conserva el volcado original
// (apps/web/supabase/migrations/20251014024325_remote_schema.sql está vacío en todas las ramas).
//
// Lo que SÍ se puede verificar desde los tipos: tablas, columnas, nulabilidad, enums,
// claves foráneas, vista `organizaciones` y firmas de funciones.
// Lo que NO está en los tipos y queda supuesto (ver supabase/baseline/README.md):
// claves primarias (se asume `id`), valores por defecto, índices únicos, checks,
// políticas RLS, triggers y cuerpos de funciones.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const src = readFileSync(resolve(root, 'apps/web/lib/types/supabase.gen.ts'), 'utf8');

function block(text, header) {
  const start = text.indexOf(header);
  if (start < 0) return '';
  let depth = 0;
  for (let i = text.indexOf('{', start); i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}' && --depth === 0) return text.slice(text.indexOf('{', start) + 1, i);
  }
  return '';
}
function entries(text, indent) {
  // Devuelve [nombre, cuerpo] para cada `nombre: {` con la indentación dada.
  const out = [];
  const re = new RegExp(`^${' '.repeat(indent)}([a-z_0-9]+): \\{$`, 'gm');
  let m;
  while ((m = re.exec(text))) out.push([m[1], block(text.slice(m.index), m[1] + ': {')]);
  return out;
}
function fields(body) {
  // Une uniones multilínea y devuelve { nombre: { type, optional } }.
  const out = {};
  const joined = body.replace(/\n\s+\|/g, ' |');
  for (const line of joined.split('\n')) {
    const m = line.match(/^\s+([a-z_0-9]+)(\??): (.+)$/i);
    if (m) out[m[1]] = { type: m[3].trim(), optional: m[2] === '?' };
  }
  return out;
}

const pub = block(src, '  public: {');
const tables = entries(block(pub, 'Tables: {'), 6);
const views = entries(block(pub, 'Views: {'), 6);
const enums = fields(block(pub, 'Enums: {'));

// Tipos que los tipos generados no distinguen (number/string). Verificados contra el código
// y las migraciones presentes en el repositorio.
const INT = /^(idx|orden|sort_order|numero|version|bloques_planificados|dias_presupuesto|dias_reales|plantas|project_uid|project_outline_level|intentos|attempts|block_index|indice|cantidad_bloques)$/;
const TS = /(_at|_en)$|^fecha|^(inicio|fin|expires|vence|vencimiento|leido_en)$/;
const TEXT_IDS = new Set(['external_id', 'payment_id', 'mp_payment_id', 'preference_id', 'wa_message_id', 'provider_message_id', 'project_outline_number', 'public_codigo']);

const tableNames = new Set(tables.map(([n]) => n));
const parsed = tables.map(([name, body]) => {
  const row = fields(block(body, 'Row: {'));
  const insert = fields(block(body, 'Insert: {'));
  const rels = [...body.matchAll(
    /foreignKeyName: "([^"]+)"\s+columns: \["([^"]+)"\]\s+isOneToOne: (true|false)\s+referencedRelation: "([^"]+)"\s+referencedColumns: \["([^"]+)"\]/g,
  )].map((m) => ({ fk: m[1], col: m[2], ref: m[4], refCol: m[5] })).filter((r) => tableNames.has(r.ref));
  return { name, row, insert, rels };
});

function sqlType(table, col, ts) {
  const base = ts.replace(/ \| null$/, '');
  const en = base.match(/^Database\["public"\]\["Enums"\]\["([a-z_]+)"\]$/);
  if (en) return `public.${en[1]}`;
  if (base === 'boolean') return 'boolean';
  if (base === 'Json') return 'jsonb';
  if (base === 'number') return INT.test(col) ? 'integer' : 'numeric';
  if (base === 'string[]') return 'text[]';
  if (base === 'number[]') return 'numeric[]';
  if (base === 'string') {
    if (TEXT_IDS.has(col)) return 'text';
    if (col === 'id' || table.rels.some((r) => r.col === col)) return 'uuid';
    if (/_id$/.test(col) || /^(validado_por|created_by|updated_by|aprobado_por|actor_id|invited_by)$/.test(col)) return 'uuid';
    if (/^fecha(_|$)/.test(col) && !/_at$/.test(col)) return /hora|_en$/.test(col) ? 'timestamptz' : 'timestamptz';
    if (TS.test(col)) return 'timestamptz';
    return 'text';
  }
  return 'text';
}
// Defaults conocidos por migraciones históricas o por el uso en el código.
const KNOWN_DEFAULTS = {
  'obras.graph_mode': "'obra_plan'", 'obras.canvas_ui': "'{}'::jsonb", 'organizations.plan_actual': "'FREE'",
  'tareas.estado': "'pendiente'", 'tareas_subtareas.estado': "'pendiente'", 'cliente_socio_agenda.estado': "'activo'",
};
function defaultFor(table, col, type, notNull, optional) {
  const known = KNOWN_DEFAULTS[`${table.name}.${col}`];
  if (known) return known;
  if (col === 'id' && type === 'uuid') return 'gen_random_uuid()';
  if (!optional || !notNull) return /^(created_at|updated_at)$/.test(col) ? 'now()' : null;
  if (type === 'timestamptz') return 'now()';
  if (type === 'boolean') return 'false';
  if (type === 'integer' || type === 'numeric') return '0';
  if (type === 'jsonb') return "'{}'::jsonb";
  if (type === 'uuid') return 'gen_random_uuid()';
  if (type.startsWith('public.')) return `'${enums[type.slice(7)].type.split('|').map((v) => v.replace(/"/g, '').trim()).filter(Boolean)[0]}'`;
  if (type === 'text') return /estado|status/.test(col) ? "'pendiente'" : /moneda|currency/.test(col) ? "'ARS'" : "''";
  return null;
}

let sql = `-- GENERADO por scripts/entorno-pruebas/generar-baseline.mjs — no editar a mano.
-- Línea base RECONSTRUIDA desde apps/web/lib/types/supabase.gen.ts (ver README.md de esta carpeta).
-- Sirve para levantar la instancia de pruebas; no es un volcado de producción.
create extension if not exists pgcrypto;
`;
for (const [name, def] of Object.entries(enums)) {
  const values = def.type.split('|').map((v) => v.trim()).filter(Boolean).map((v) => `'${v.replace(/"/g, '')}'`);
  sql += `create type public.${name} as enum (${values.join(', ')});\n`;
}
const fks = [];
for (const table of parsed) {
  const cols = Object.entries(table.row).map(([col, def]) => {
    const type = sqlType(table, col, def.type);
    const notNull = !/\| null$/.test(def.type);
    const dflt = defaultFor(table, col, type, notNull, table.insert[col]?.optional ?? true);
    return `  ${col} ${type}${notNull ? ' not null' : ''}${dflt ? ` default ${dflt}` : ''}${col === 'id' ? ' primary key' : ''}`;
  });
  sql += `\ncreate table public.${table.name} (\n${cols.join(',\n')}\n);\n`;
  for (const rel of table.rels) {
    fks.push(`alter table public.${table.name} add constraint ${rel.fk} foreign key (${rel.col}) references public.${rel.ref}(${rel.refCol});`);
  }
}
sql += `\n-- Claves foráneas (tomadas de Relationships en los tipos generados)\n${[...new Set(fks)].join('\n')}\n`;
for (const [name] of views) {
  if (name === 'organizaciones') sql += `\ncreate view public.organizaciones with (security_invoker = true) as\n  select id, name as nombre, name, cuit, address, created_at, avatar_url, plan_actual, user_id, user_id as owner_user_id from public.organizations;\n`;
  else sql += `\n-- VISTA NO RECONSTRUIDA: public.${name} (los tipos no incluyen su definición)\n`;
}
const out = resolve(root, 'supabase/baseline/00_tablas_reconstruidas.sql');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, sql);
console.log(`baseline: ${parsed.length} tablas, ${Object.keys(enums).length} enums, ${new Set(fks).size} FKs → ${out}`);
