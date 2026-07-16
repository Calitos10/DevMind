import { describe, expect, it } from "vitest";

import { SimilarCodeChunk } from "../../../../src/domain/repositories/codeChunkEmbeddingRepository";
import { GenkitAnswerGenerator } from "../../../../src/infrastructure/genkit/genkitAnswerGenerator";

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
});
