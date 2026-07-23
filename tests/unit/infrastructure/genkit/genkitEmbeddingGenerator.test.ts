import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Delay } from "../../../../src/application/ports/delay";
import { EmbeddingProviderUnavailableError } from "../../../../src/shared/errors/embeddingProviderUnavailableError";

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

// Delay falso: registra las esperas pero resuelve al instante, para que los
// tests de reintento no esperen de verdad.
class FakeDelay implements Delay {
  public waits: number[] = [];

  async wait(milliseconds: number): Promise<void> {
    this.waits.push(milliseconds);
  }
}

// Error transitorio con la forma de un GenkitError de servicio no disponible.
function transientGenkitError(): Error {
  return Object.assign(
    new Error("[503 Service Unavailable] The service is currently unavailable."),
    { status: "UNAVAILABLE", code: 503 },
  );
}

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

  it("retries on a transient provider error and then succeeds", async () => {
    embedMock
      .mockRejectedValueOnce(transientGenkitError())
      .mockResolvedValue([{ embedding: [0.1, 0.2, 0.3] }]);

    const delay = new FakeDelay();
    const generator = new GenkitEmbeddingGenerator(delay, 3, 1000);

    const embedding = await generator.generateEmbedding("some code");

    expect(embedding).toEqual([0.1, 0.2, 0.3]);
    expect(embedMock).toHaveBeenCalledTimes(2);
    expect(delay.waits).toEqual([1000]);
  });

  it("throws EmbeddingProviderUnavailableError when the provider keeps failing", async () => {
    embedMock.mockRejectedValue(transientGenkitError());

    const delay = new FakeDelay();
    const generator = new GenkitEmbeddingGenerator(delay, 3, 1000);

    await expect(generator.generateEmbedding("some code")).rejects.toBeInstanceOf(
      EmbeddingProviderUnavailableError,
    );

    // 1 intento inicial + 3 reintentos = 4 llamadas
    expect(embedMock).toHaveBeenCalledTimes(4);
    expect(delay.waits).toEqual([1000, 2000, 4000]);
  });

  it("rethrows non-transient errors as-is without retrying", async () => {
    embedMock.mockRejectedValue(new Error("invalid api key"));

    const delay = new FakeDelay();
    const generator = new GenkitEmbeddingGenerator(delay, 3, 1000);

    await expect(generator.generateEmbedding("some code")).rejects.toThrow(
      "invalid api key",
    );

    expect(embedMock).toHaveBeenCalledTimes(1);
    expect(delay.waits).toEqual([]);
  });
});
