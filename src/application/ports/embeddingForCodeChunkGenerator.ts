import type { CodeChunk } from "../../domain/entities/codeChunk";
import type { CodeChunkEmbedding } from "../../domain/entities/codeChunkEmbedding";

export type GenerateEmbeddingForCodeChunkResult = {
  codeChunkId: string;
  embeddingCreated: boolean;
  codeChunkEmbedding: CodeChunkEmbedding;
};

// Puerto para el caso de uso que genera el embedding de un CodeChunk.
// Permite que la indexación dependa de este contrato explícito en lugar de un
// tipo local anónimo con Promise<unknown>.
export interface EmbeddingForCodeChunkGenerator {
  execute(input: {
    codeChunk: CodeChunk;
  }): Promise<GenerateEmbeddingForCodeChunkResult>;
}
