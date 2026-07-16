import type { ProjectFile } from "../../domain/entities/projectFile";
import type { CodeChunk } from "../../domain/entities/codeChunk";

export type GenerateCodeChunksResult = {
  projectFileId: string;
  chunksCreated: number;
  chunks: CodeChunk[];
};

// Puerto para el caso de uso que genera los CodeChunks de un ProjectFile.
// Permite que otros casos de uso (p. ej. la subida de ZIP) dependan de este
// contrato explícito en lugar de un tipo local anónimo con Promise<unknown>.
export interface CodeChunkGenerator {
  execute(input: {
    projectFile: ProjectFile;
  }): Promise<GenerateCodeChunksResult>;
}
