import "dotenv/config";

import { postgresPool } from "../src/infrastructure/database/postgresPool";
import { PostgresUserRepository } from "../src/infrastructure/repositoryAdapter/postgres/postgresUserRepository";
import { PostgresProjectRepository } from "../src/infrastructure/repositoryAdapter/postgres/postgresProjectRepository";
import { PostgresProjectFileRepository } from "../src/infrastructure/repositoryAdapter/postgres/postgresProjectFileRepository";

async function main() {
  const userRepository = new PostgresUserRepository(postgresPool);
  const projectRepository = new PostgresProjectRepository(postgresPool);
  const projectFileRepository = new PostgresProjectFileRepository(postgresPool);

  const timestamp = Date.now();

  const user = await userRepository.save({
    id: `user-${timestamp}`,
    name: "User One",
    email: `project-file-user-${timestamp}@example.com`,
    passwordHash: "hashed-password",
    createdAt: new Date(),
  });

  console.log("Created user:");
  console.log(user);

  const project = await projectRepository.save({
    id: `project-${timestamp}`,
    ownerId: user.id,
    name: "DevMind API",
    description: "Backend with AI",
    createdAt: new Date(),
  });

  console.log("Created project:");
  console.log(project);

  const content = "console.log('hello');";

  const createdProjectFile = await projectFileRepository.save({
    id: `file-${timestamp}`,
    projectId: project.id,
    path: "src/app.ts",
    language: "typescript",
    content,
    size: content.length,
    hash: "fake-hash-for-manual-test",
    createdAt: new Date(),
  });

  console.log("Created project file:");
  console.log(createdProjectFile);

  const projectFiles = await projectFileRepository.findByProjectId(project.id);

  console.log("Project files:");
  console.log(projectFiles);

  const projectFileById = await projectFileRepository.findByIdAndProjectId(
    createdProjectFile.id,
    project.id,
  );

  console.log("Project file by id:");
  console.log(projectFileById);

  await projectFileRepository.deleteByIdAndProjectId(
    createdProjectFile.id,
    project.id,
  );

  const deletedProjectFile = await projectFileRepository.findByIdAndProjectId(
    createdProjectFile.id,
    project.id,
  );

  console.log("Deleted project file should be null:");
  console.log(deletedProjectFile);

  await postgresPool.end();
}

main().catch(async (error) => {
  console.error("PostgresProjectFileRepository test failed");
  console.error(error);

  await postgresPool.end();

  process.exit(1);
});
