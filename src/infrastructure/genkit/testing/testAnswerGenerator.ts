import type { AnswerGenerator } from "../../../application/ports/answerGenerator";

export class TestAnswerGenerator implements AnswerGenerator {
  async generateAnswer(): Promise<string> {
    return "Respuesta generada por IA pendiente de implementar.";
  }
}