export type ProjectFile = {
  id: string;
  projectId: string;
  path: string;
  language: string;
  content: string;
  size: number;
  hash: string;
  createdAt: Date;
};