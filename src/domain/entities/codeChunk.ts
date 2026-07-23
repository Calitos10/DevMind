export type CodeChunk = {
  id: string;
  projectId: string;
  projectFileId: string;
  content: string;
  startLine: number;
  endLine: number;
  index: number;
  createdAt: Date;
};