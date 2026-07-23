import { describe, expect, it } from "vitest";

import type { Delay } from "../../../../src/application/ports/delay";
import { SimilarCodeChunk } from "../../../../src/domain/repositories/codeChunkEmbeddingRepository";
import { GenkitAnswerGenerator } from "../../../../src/infrastructure/genkit/genkitAnswerGenerator";
import { AnswerProviderUnavailableError } from "../../../../src/shared/errors/answerProviderUnavailableError";

type FakeGenerateInput = {
  prompt: string;
};

class FakeAi {
  public receivedGenerateInputs: FakeGenerateInput[] = [];

  async generate(input: FakeGenerateInput): Promise<{ text: string }> {
    this.receivedGenerateInputs.push(input);

    return {
      text: "El registro de usuario se realiza en RegisterUserUseCase.",
    };
  }
}

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

// aiClient falso que falla las primeras `failTimes` llamadas y luego responde.
class FlakyAi {
  public calls = 0;

  constructor(
    private readonly failTimes: number,
    private readonly error: Error,
  ) {}

  async generate(): Promise<{ text: string }> {
    this.calls += 1;

    if (this.calls <= this.failTimes) {
      throw this.error;
    }

    return { text: "respuesta correcta" };
  }
}

describe("GenkitAnswerGenerator", () => {
  it("generates an answer using the question and context chunks", async () => {
    const fakeAi = new FakeAi();

    const generator = new GenkitAnswerGenerator(fakeAi);

    const contextChunks: SimilarCodeChunk[] = [
      {
        codeChunkId: "code-chunk-1",
        projectId: "project-1",
        projectFileId: "project-file-1",
        path: "src/auth/registerUserUseCase.ts",
        content: "export class RegisterUserUseCase {}",
        startLine: 10,
        endLine: 45,
        index: 0,
        distance: 0.12,
      },
    ];

    const answer = await generator.generateAnswer({
      question: "¿Dónde se registra un usuario?",
      contextChunks,
    });

    expect(answer).toBe(
      "El registro de usuario se realiza en RegisterUserUseCase.",
    );

    expect(fakeAi.receivedGenerateInputs).toHaveLength(1);

    const prompt = fakeAi.receivedGenerateInputs[0].prompt;

    expect(prompt).toContain("¿Dónde se registra un usuario?");
    expect(prompt).toContain("src/auth/registerUserUseCase.ts");
    expect(prompt).toContain("líneas 10-45");
    expect(prompt).toContain("export class RegisterUserUseCase {}");
    expect(prompt).toContain(
      "No inventes información que no esté en el contexto",
    );
  });
  it("returns a fallback answer when the model returns an empty text", async () => {
    class FakeEmptyAi {
      async generate(): Promise<{ text: string }> {
        return {
          text: "",
        };
      }
    }

    const generator = new GenkitAnswerGenerator(new FakeEmptyAi());

    const answer = await generator.generateAnswer({
      question: "¿Dónde se registra un usuario?",
      contextChunks: [
        {
          codeChunkId: "code-chunk-1",
          projectId: "project-1",
          projectFileId: "project-file-1",
          path: "src/auth/registerUserUseCase.ts",
          content: "export class RegisterUserUseCase {}",
          startLine: 10,
          endLine: 45,
          index: 0,
          distance: 0.12,
        },
      ],
    });

    expect(answer).toBe(
      "No he podido generar una respuesta con el contexto disponible.",
    );
  });

  it("retries on a transient provider error and then succeeds", async () => {
    const flakyAi = new FlakyAi(1, transientGenkitError());
    const delay = new FakeDelay();

    const generator = new GenkitAnswerGenerator(flakyAi, delay, 3, 1000);

    const answer = await generator.generateAnswer({
      question: "¿Dónde se registra un usuario?",
      contextChunks: [],
    });

    expect(answer).toBe("respuesta correcta");
    expect(flakyAi.calls).toBe(2);
    expect(delay.waits).toEqual([1000]);
  });

  it("throws AnswerProviderUnavailableError when the provider keeps failing", async () => {
    const flakyAi = new FlakyAi(99, transientGenkitError());
    const delay = new FakeDelay();

    const generator = new GenkitAnswerGenerator(flakyAi, delay, 3, 1000);

    await expect(
      generator.generateAnswer({
        question: "¿Dónde se registra un usuario?",
        contextChunks: [],
      }),
    ).rejects.toBeInstanceOf(AnswerProviderUnavailableError);

    // 1 intento inicial + 3 reintentos = 4 llamadas
    expect(flakyAi.calls).toBe(4);
    expect(delay.waits).toEqual([1000, 2000, 4000]);
  });

  it("rethrows non-transient errors as-is without retrying", async () => {
    const flakyAi = new FlakyAi(99, new Error("invalid api key"));
    const delay = new FakeDelay();

    const generator = new GenkitAnswerGenerator(flakyAi, delay, 3, 1000);

    await expect(
      generator.generateAnswer({
        question: "¿Dónde se registra un usuario?",
        contextChunks: [],
      }),
    ).rejects.toThrow("invalid api key");

    expect(flakyAi.calls).toBe(1);
    expect(delay.waits).toEqual([]);
  });
});
