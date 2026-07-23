export type ProjectIndexingJobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type ProjectIndexingJob = {
  id: string;
  projectId: string;
  status: ProjectIndexingJobStatus;
  totalChunks: number;
  processedChunks: number;
  failedChunks: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
};