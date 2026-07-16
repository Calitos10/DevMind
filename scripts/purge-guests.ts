import "dotenv/config";

import { postgresPool } from "../src/infrastructure/database/postgresPool";
import { PostgresUserRepository } from "../src/infrastructure/repositoryAdapter/postgres/postgresUserRepository";

// Borra los usuarios invitados cuya caducidad ya pasó. Las cascadas de la base
// de datos arrastran todos sus datos (proyectos, archivos, chunks, embeddings,
// jobs e historial). Se puede ejecutar a mano (npm run purge-guests) o
// programarse externamente (cron). El scheduler automático se deja como mejora
// futura (ver Plan_Modo_Invitado.md, opción B: limpieza diferida).
async function main() {
  const userRepository = new PostgresUserRepository(postgresPool);

  const deleted = await userRepository.deleteExpiredGuests(new Date());

  console.log(`Deleted ${deleted} expired guest user(s)`);

  await postgresPool.end();
}

main().catch(async (error) => {
  console.error("Guest purge failed");
  console.error(error);

  await postgresPool.end();

  process.exit(1);
});
