-- Schema para tabla de reservas en Supabase
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase

-- Crear la tabla reservations
CREATE TABLE IF NOT EXISTS public.reservations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  guests INTEGER NOT NULL,
  "tableId" INTEGER NOT NULL,
  "tableName" TEXT NOT NULL,
  dishes JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT false,
  "releasedAt" TIMESTAMPTZ
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_reservations_date ON public.reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_date_time ON public.reservations(date, time);
CREATE INDEX IF NOT EXISTS idx_reservations_tableId ON public.reservations(tableId);

-- Políticas RLS (Row Level Security) básicas
-- IMPORTANTE: Estas políticas son muy permisivas para desarrollo/demo
-- En producción deberías restringir más según tu modelo de autenticación

-- Habilitar RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública (anon puede leer todas las reservas)
CREATE POLICY "Allow public read access" 
  ON public.reservations FOR SELECT 
  USING (true);

-- Permitir inserción pública (anon puede crear reservas)
CREATE POLICY "Allow public insert" 
  ON public.reservations FOR INSERT 
  WITH CHECK (true);

-- Permitir actualización pública (anon puede actualizar - para sincronización)
-- NOTA: En producción, considera limitar esto solo a usuarios autenticados
CREATE POLICY "Allow public update" 
  ON public.reservations FOR UPDATE 
  USING (true)
  WITH CHECK (true);

-- Permitir eliminación pública (anon puede eliminar)
-- NOTA: En producción, esto debería estar muy restringido o requerir autenticación
CREATE POLICY "Allow public delete" 
  ON public.reservations FOR DELETE 
  USING (true);

-- Opcional: Crear función para limpiar reservas antiguas
CREATE OR REPLACE FUNCTION delete_old_reservations()
RETURNS void AS $$
BEGIN
  DELETE FROM public.reservations 
  WHERE date < CURRENT_DATE - INTERVAL '30 days' 
    AND status IN ('cancelled', 'confirmed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios en la tabla
COMMENT ON TABLE public.reservations IS 'Almacena las reservas del restaurante Chifa Ali';
COMMENT ON COLUMN public.reservations.dishes IS 'Array JSON con los platos pre-ordenados: [{id, name, price, quantity}]';
COMMENT ON COLUMN public.reservations.status IS 'Estados posibles: pending, confirmed, cancelled';
COMMENT ON COLUMN public.reservations."tableId" IS 'ID de la mesa asignada (1-10)';
COMMENT ON COLUMN public.reservations."tableName" IS 'Nombre descriptivo de la mesa';
COMMENT ON COLUMN public.reservations."createdAt" IS 'Timestamp de creación de la reserva';
COMMENT ON COLUMN public.reservations.active IS 'true cuando la reserva confirmada mantiene la mesa ocupada';
COMMENT ON COLUMN public.reservations."releasedAt" IS 'Momento en que la mesa fue liberada manualmente';

-- Alter table safety (para instalaciones existentes)
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "releasedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT,
  ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMPTZ;
