import { describe, expect, it } from "vitest";

import { CreateProjectUseCase } from "../../../../src/application/projects/createProjectUseCase";
import { FakeIdGenerator } from "../../../fakes/fakeIdGenerator";
import { FakeProjectRepository } from "../../../fakes/fakeProjectRepository";

describe("CreateProjectUseCase", () => {
  it("should create a project associated with a user", async () => {
    const projectRepository = new FakeProjectRepository();
    const idGenerator = new FakeIdGenerator("project-1");

    const useCase = new CreateProjectUseCase(projectRepository, idGenerator);

    const result = await useCase.execute({
      ownerId: "user-1",
      name: "DevMind API",
      description: "Backend con IA para consultar proyectos software",
    });

    expect(result).toEqual({
      id: "project-1",
      ownerId: "user-1",
      name: "DevMind API",
      description: "Backend con IA para consultar proyectos software",
      createdAt: expect.any(Date),
    });
  });
});
