export interface ProjectIndexingScheduler {
  schedule(input: {
    projectId: string;
    ownerId: string;
  }): void;
}