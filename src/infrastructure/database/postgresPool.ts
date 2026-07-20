import "dotenv/config";

import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not defined");
}

// Algunos proveedores de PostgreSQL gestionado (Neon, Supabase, Render externo)
// exigen conexión por SSL; otros, como la red interna de Railway, no lo usan.
// Se activa por variable de entorno para funcionar en ambos casos sin cambiar el
// código: DATABASE_SSL=true en el proveedor que lo requiera.
const useSsl = process.env.DATABASE_SSL === "true";

export const postgresPool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});
