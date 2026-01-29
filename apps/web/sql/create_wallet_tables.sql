-- Tabla para almacenar los saldos de wallet
CREATE TABLE IF NOT EXISTS wallet_saldos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  socio_id UUID REFERENCES socios(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  saldo_actual NUMERIC(15, 2) NOT NULL DEFAULT 0,
  saldo_pendiente NUMERIC(15, 2) NOT NULL DEFAULT 0,
  moneda VARCHAR(3) NOT NULL DEFAULT 'ARS',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint: debe tener socio_id o org_id, pero no ambos
  CONSTRAINT wallet_saldos_owner_check CHECK (
    (socio_id IS NOT NULL AND org_id IS NULL) OR
    (socio_id IS NULL AND org_id IS NOT NULL)
  ),
  
  -- Unique constraint por owner
  CONSTRAINT wallet_saldos_unique_socio UNIQUE (socio_id) WHERE socio_id IS NOT NULL,
  CONSTRAINT wallet_saldos_unique_org UNIQUE (org_id) WHERE org_id IS NOT NULL
);

-- Tabla para almacenar los movimientos de wallet
CREATE TABLE IF NOT EXISTS wallet_movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  socio_id UUID REFERENCES socios(id) ON DELETE SET NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  tarea_id UUID REFERENCES tareas(id) ON DELETE SET NULL,
  presupuesto_id UUID REFERENCES tareas_presupuestos(id) ON DELETE SET NULL,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('credito', 'debito')),
  monto NUMERIC(15, 2) NOT NULL CHECK (monto > 0),
  metodo_pago VARCHAR(20) CHECK (metodo_pago IN ('EFECTIVO', 'ONLINE')),
  concepto TEXT NOT NULL,
  origen TEXT, -- 'VALIDACION_TAREA', etc.
  estado VARCHAR(20) NOT NULL DEFAULT 'completado' CHECK (estado IN ('pendiente', 'completado', 'cancelado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint: debe tener socio_id o org_id, pero no ambos
  CONSTRAINT wallet_movimientos_owner_check CHECK (
    (socio_id IS NOT NULL AND org_id IS NULL) OR
    (socio_id IS NULL AND org_id IS NOT NULL)
  )
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_wallet_saldos_socio ON wallet_saldos(socio_id) WHERE socio_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wallet_saldos_org ON wallet_saldos(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wallet_movimientos_socio ON wallet_movimientos(socio_id) WHERE socio_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wallet_movimientos_org ON wallet_movimientos(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wallet_movimientos_tarea ON wallet_movimientos(tarea_id) WHERE tarea_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wallet_movimientos_created_at ON wallet_movimientos(created_at DESC);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_wallet_saldos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_wallet_saldos_updated_at ON wallet_saldos;
CREATE TRIGGER trigger_update_wallet_saldos_updated_at
  BEFORE UPDATE ON wallet_saldos
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_saldos_updated_at();

















