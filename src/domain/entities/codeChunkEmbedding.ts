export type CodeChunkEmbedding = {
  id: string;
  projectId: string;
  codeChunkId: string;
  embedding: number[];
  createdAt: Date;
};