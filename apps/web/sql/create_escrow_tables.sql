-- Tabla para almacenar transacciones de escrow (retención de fondos)
CREATE TABLE IF NOT EXISTS escrow_transacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarea_id UUID REFERENCES tareas(id) ON DELETE SET NULL,
  presupuesto_id UUID REFERENCES tareas_presupuestos(id) ON DELETE SET NULL,
  socio_id UUID REFERENCES socios(id) ON DELETE SET NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  cliente_id UUID, -- Puede referenciar a usuarios o clientes_tecnicos según tu estructura
  
  -- Información financiera
  monto_total NUMERIC(15, 2) NOT NULL CHECK (monto_total > 0),
  monto_comision NUMERIC(15, 2) NOT NULL DEFAULT 0,
  monto_socio NUMERIC(15, 2) NOT NULL DEFAULT 0,
  moneda VARCHAR(3) NOT NULL DEFAULT 'ARS',
  
  -- Estados del escrow
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'retenido', 'liberado', 'reembolsado', 'cancelado')),
  
  -- Información de MercadoPago
  mp_preference_id VARCHAR(255),
  mp_payment_id VARCHAR(255),
  mp_status VARCHAR(50),
  mp_raw_payload JSONB,
  
  -- Proveedor de pago
  proveedor VARCHAR(50) NOT NULL DEFAULT 'MERCADOPAGO',
  
  -- Fechas importantes
  fecha_deposito TIMESTAMPTZ,
  fecha_liberacion TIMESTAMPTZ,
  fecha_reembolso TIMESTAMPTZ,
  
  -- Información adicional
  motivo_reembolso TEXT,
  metadata JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT escrow_tarea_check CHECK (tarea_id IS NOT NULL),
  CONSTRAINT escrow_socio_check CHECK (socio_id IS NOT NULL),
  CONSTRAINT escrow_org_check CHECK (org_id IS NOT NULL)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_escrow_tarea_id ON escrow_transacciones(tarea_id);
CREATE INDEX IF NOT EXISTS idx_escrow_socio_id ON escrow_transacciones(socio_id);
CREATE INDEX IF NOT EXISTS idx_escrow_org_id ON escrow_transacciones(org_id);
CREATE INDEX IF NOT EXISTS idx_escrow_estado ON escrow_transacciones(estado);
CREATE INDEX IF NOT EXISTS idx_escrow_mp_preference_id ON escrow_transacciones(mp_preference_id);
CREATE INDEX IF NOT EXISTS idx_escrow_mp_payment_id ON escrow_transacciones(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_escrow_created_at ON escrow_transacciones(created_at DESC);

-- Agregar campo escrow_id a wallet_movimientos si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wallet_movimientos' 
    AND column_name = 'escrow_id'
  ) THEN
    ALTER TABLE wallet_movimientos 
    ADD COLUMN escrow_id UUID REFERENCES escrow_transacciones(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_wallet_movimientos_escrow_id ON wallet_movimientos(escrow_id);
  END IF;
END $$;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_escrow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_escrow_updated_at ON escrow_transacciones;
CREATE TRIGGER trigger_update_escrow_updated_at
  BEFORE UPDATE ON escrow_transacciones
  FOR EACH ROW
  EXECUTE FUNCTION update_escrow_updated_at();












