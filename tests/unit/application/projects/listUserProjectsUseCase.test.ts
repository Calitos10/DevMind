import { describe, expect, it } from "vitest";

import { ListUserProjectsUseCase } from "../../../../src/application/projects/listUserProjectsUseCase";
import { FakeProjectRepository } from "../../../fakes/fakeProjectRepository";

describe("ListUserProjectsUseCase", () => {
  it("should list only projects owned by the user", async () => {
    const projectRepository = new FakeProjectRepository();

    await projectRepository.save({
      id: "project-1",
      ownerId: "user-1",
      name: "DevMind API",
      description: "Backend con IA",
      createdAt: new Date("2026-01-01"),
    });

    await projectRepository.save({
      id: "project-2",
      ownerId: "user-1",
      name: "Portfolio",
      description: "Portfolio personal",
      createdAt: new Date("2026-01-02"),
    });

    await projectRepository.save({
      id: "project-3",
      ownerId: "user-2",
      name: "Proyecto de otro usuario",
      description: "Este proyecto no debería aparecer",
      createdAt: new Date("2026-01-03"),
    });

    const useCase = new ListUserProjectsUseCase(projectRepository);

    const result = await useCase.execute({
      ownerId: "user-1",
    });

    expect(result).toHaveLength(2);

    expect(result).toEqual([
      {
        id: "project-1",
        ownerId: "user-1",
        name: "DevMind API",
        description: "Backend con IA",
        createdAt: new Date("2026-01-01"),
      },
      {
        id: "project-2",
        ownerId: "user-1",
        name: "Portfolio",
        description: "Portfolio personal",
        createdAt: new Date("2026-01-02"),
      },
    ]);
  });
});
