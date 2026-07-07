import { beforeEach, describe, expect, it, vi } from "vitest";

const { embedMock, fakeEmbedder } = vi.hoisted(() => ({
  embedMock: vi.fn(),
  fakeEmbedder: "fake-code-embedding-embedder",
}));

vi.mock("../../../../src/infrastructure/genkit/ai", () => ({
  ai: {
    embed: embedMock,
  },
  codeEmbeddingEmbedder: fakeEmbedder,
}));

import { GenkitEmbeddingGenerator } from "../../../../src/infrastructure/genkit/genkitEmbeddingGenerator";

describe("GenkitEmbeddingGenerator", () => {
  beforeEach(() => {
    embedMock.mockReset();
  });

  it("generates an embedding using the configured Genkit embedder", async () => {
    embedMock.mockResolvedValue([
      {
        embedding: [0.1, 0.2, 0.3],
      },
    ]);

    const generator = new GenkitEmbeddingGenerator();

    const embedding = await generator.generateEmbedding(
      "export const hello = 'world';",
    );

    expect(embedMock).toHaveBeenCalledWith({
      embedder: fakeEmbedder,
      content: "export const hello = 'world';",
      options: {
        outputDimensionality: 768,
      },
    });

    expect(embedding).toEqual([0.1, 0.2, 0.3]);
  });
});