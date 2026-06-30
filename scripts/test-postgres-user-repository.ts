import "dotenv/config";

import { postgresPool } from "../src/infrastructure/database/postgresPool";
import { PostgresUserRepository } from "../src/infrastructure/repositoryAdapter/postgres/postgresUserRepository";

async function main() {
  const userRepository = new PostgresUserRepository(postgresPool);

  const email = `user-${Date.now()}@example.com`;

  const createdUser = await userRepository.save({
  id: `user-${Date.now()}`,
  name: "User One",
  email,
  passwordHash: "hashed-password",
  createdAt: new Date(),
});

  console.log("Created user:");
  console.log(createdUser);

  const userByEmail = await userRepository.findByEmail(email);

  console.log("User by email:");
  console.log(userByEmail);

  const userById = await userRepository.findById(createdUser.id);

  console.log("User by id:");
  console.log(userById);

  await postgresPool.end();
}

main().catch(async (error) => {
  console.error("PostgresUserRepository test failed");
  console.error(error);

  await postgresPool.end();

  process.exit(1);
});