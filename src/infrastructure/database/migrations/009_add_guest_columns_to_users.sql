-- Columnas para el modo invitado: marcan a un usuario como invitado temporal.
-- Los usuarios registrados existentes mantienen los valores por defecto
-- (is_guest = false, expires_at = NULL), así que no se ven afectados.
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_guest BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP NULL;

-- Índice para que la limpieza de invitados caducados sea eficiente.
CREATE INDEX IF NOT EXISTS users_is_guest_expires_at_idx
ON users(is_guest, expires_at);
