# RLS Policies (Supabase)

Las siguientes sentencias habilitan Row Level Security (RLS) y crean una política de aislamiento por organización para las tablas críticas del proyecto. Ejecuta cada bloque en el editor SQL de tu proyecto Supabase.

```sql
-- Obras
alter table public.obras enable row level security;

create policy "Org isolated access - obras"
on public.obras
for all
using (
  org_id::text = coalesce(auth.jwt() ->> 'org_id', '')
);
```

```sql
-- Tareas
alter table public.tareas enable row level security;

create policy "Org isolated access - tareas"
on public.tareas
for all
using (
  org_id::text = coalesce(auth.jwt() ->> 'org_id', '')
);
```

```sql
-- Socios
alter table public.socios enable row level security;

create policy "Org isolated access - socios"
on public.socios
for all
using (
  org_id::text = coalesce(auth.jwt() ->> 'org_id', '')
);
```

```sql
-- Eventos
alter table public.eventos enable row level security;

create policy "Org isolated access - eventos"
on public.eventos
for all
using (
  org_id::text = coalesce(auth.jwt() ->> 'org_id', '')
);
```

> **Nota:** Si tus columnas `org_id` están tipadas como `uuid`, puedes comparar con `coalesce(auth.jwt() ->> 'org_id', '')::uuid` en lugar de castear a texto. Repite políticas adicionales (`INSERT`, `UPDATE`, `DELETE`) si tu modelo lo requiere.

Después de aplicar las políticas, cada usuario autenticado solo podrá ver registros asociados a su organización (`org_id`), manteniendo el aislamiento multi-tenant. En modo desarrollador (con `NEXT_PUBLIC_DEV_MODE=true`), el frontend evita estos chequeos para facilitar las pruebas locales.
