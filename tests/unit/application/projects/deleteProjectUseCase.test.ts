import { describe, expect, it } from "vitest";

import { DeleteProjectUseCase } from "../../../../src/application/projects/deleteProjectUseCase";
import { ProjectNotFoundError } from "../../../../src/shared/errors/projectNotFoundError";
import { FakeProjectRepository } from "../../../fakes/fakeProjectRepository";

describe("DeleteProjectUseCase", () => {
  it("should delete a project when it belongs to the user", async () => {
    const projectRepository = new FakeProjectRepository();

    await projectRepository.save({
      id: "project-1",
      ownerId: "user-1",
      name: "DevMind API",
      description: "Backend con IA",
      createdAt: new Date("2026-01-01"),
    });

    const useCase = new DeleteProjectUseCase(projectRepository);

    await useCase.execute({
      projectId: "project-1",
      ownerId: "user-1",
    });

    const deletedProject = await projectRepository.findByIdAndOwnerId(
      "project-1",
      "user-1",
    );

    expect(deletedProject).toBeNull();
  });

  it("should throw ProjectNotFoundError when the project belongs to another user", async () => {
    const projectRepository = new FakeProjectRepository();

    await projectRepository.save({
      id: "project-1",
      ownerId: "user-2",
      name: "Proyecto privado de otro usuario",
      description: "No debería poder borrarlo user-1",
      createdAt: new Date("2026-01-01"),
    });

    const useCase = new DeleteProjectUseCase(projectRepository);

    await expect(
      useCase.execute({
        projectId: "project-1",
        ownerId: "user-1",
      }),
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
  });

  it("should throw ProjectNotFoundError when the project does not exist", async () => {
    const projectRepository = new FakeProjectRepository();

    const useCase = new DeleteProjectUseCase(projectRepository);

    await expect(
      useCase.execute({
        projectId: "non-existing-project",
        ownerId: "user-1",
      }),
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
  });
});
