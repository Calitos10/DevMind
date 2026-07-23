import { describe, expect, it } from "vitest";

import { GetProjectByIdUseCase } from "../../../../src/application/projects/getProjectByIdUseCase";
import { ProjectNotFoundError } from "../../../../src/shared/errors/projectNotFoundError";
import { FakeProjectRepository } from "../../../fakes/fakeProjectRepository";

describe("GetProjectByIdUseCase", () => {
  it("should return a project when it belongs to the user", async () => {
    const projectRepository = new FakeProjectRepository();

    await projectRepository.save({
      id: "project-1",
      ownerId: "user-1",
      name: "DevMind API",
      description: "Backend con IA",
      createdAt: new Date("2026-01-01"),
    });

    const useCase = new GetProjectByIdUseCase(projectRepository);

    const result = await useCase.execute({
      projectId: "project-1",
      ownerId: "user-1",
    });

    expect(result).toEqual({
      id: "project-1",
      ownerId: "user-1",
      name: "DevMind API",
      description: "Backend con IA",
      createdAt: new Date("2026-01-01"),
    });
  });

  it("should throw ProjectNotFoundError when the project belongs to another user", async () => {
    const projectRepository = new FakeProjectRepository();

    await projectRepository.save({
      id: "project-1",
      ownerId: "user-2",
      name: "Proyecto privado de otro usuario",
      description: "No debería poder verlo user-1",
      createdAt: new Date("2026-01-01"),
    });

    const useCase = new GetProjectByIdUseCase(projectRepository);

    await expect(
      useCase.execute({
        projectId: "project-1",
        ownerId: "user-1",
      }),
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
  });

  it("should throw ProjectNotFoundError when the project does not exist", async () => {
    const projectRepository = new FakeProjectRepository();

    const useCase = new GetProjectByIdUseCase(projectRepository);

    await expect(
      useCase.execute({
        projectId: "non-existing-project",
        ownerId: "user-1",
      }),
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
  });
});
