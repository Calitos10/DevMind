import type { ProjectIndexingScheduler } from "../../application/ports/projectIndexingScheduler";

export class NoopProjectIndexingScheduler implements ProjectIndexingScheduler {
  schedule(_input: { projectId: string; ownerId: string }): void {
    // Intentionally empty.
    // Used in tests to avoid launching background indexing jobs.
  }
}