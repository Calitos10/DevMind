import "dotenv/config";

import { postgresPool } from "../src/infrastructure/database/postgresPool";
import { PostgresUserRepository } from "../src/infrastructure/repositoryAdapter/postgres/postgresUserRepository";
import { PostgresProjectRepository } from "../src/infrastructure/repositoryAdapter/postgres/postgresProjectRepository";

async function main() {
  const userRepository = new PostgresUserRepository(postgresPool);
  const projectRepository = new PostgresProjectRepository(postgresPool);

  const timestamp = Date.now();

  const user = await userRepository.save({
    id: `user-${timestamp}`,
    name: "User One",
    email: `project-user-${timestamp}@example.com`,
    passwordHash: "hashed-password",
    createdAt: new Date(),
  });

  console.log("Created user:");
  console.log(user);

  const createdProject = await projectRepository.save({
    id: `project-${timestamp}`,
    ownerId: user.id,
    name: "DevMind API",
    description: "Backend with AI",
    createdAt: new Date(),
  });

  console.log("Created project:");
  console.log(createdProject);

  const projectsByOwner = await projectRepository.findByOwnerId(user.id);

  console.log("Projects by owner:");
  console.log(projectsByOwner);

  const projectByIdAndOwner = await projectRepository.findByIdAndOwnerId(
    createdProject.id,
    user.id,
  );

  console.log("Project by id and owner:");
  console.log(projectByIdAndOwner);

  await projectRepository.deleteByIdAndOwnerId(createdProject.id, user.id);

  const deletedProject = await projectRepository.findByIdAndOwnerId(
    createdProject.id,
    user.id,
  );

  console.log("Deleted project should be null:");
  console.log(deletedProject);

  await postgresPool.end();
}

main().catch(async (error) => {
  console.error("PostgresProjectRepository test failed");
  console.error(error);

  await postgresPool.end();

  process.exit(1);
});
