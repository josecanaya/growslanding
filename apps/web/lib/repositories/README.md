# Repositorios (Supabase-first)

Convención propuesta tras retirada gradual de Prisma del core (`PRISMA_USAGE_REPORT.md`):

- Una clase o módulo por agregado: `ObrasRepository`, `TareasRepository`, `SociosRepository`, `WalletRepository`, etc.
- Solo **queries** Postgres vía cliente Supabase (server); sin `PrismaClient` en rutas nuevas.
- Los API Routes (`app/api/**`) llaman servicios (`lib/services/*`) que delegan en repositorios.

Implementar cuando se migre cada endpoint legacy; hasta entonces algunos servicios pueden seguir en Prisma.
