CREATE TABLE IF NOT EXISTS project_indexing_jobs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  total_chunks INTEGER NOT NULL DEFAULT 0,
  processed_chunks INTEGER NOT NULL DEFAULT 0,
  failed_chunks INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT project_indexing_jobs_project_id_unique UNIQUE (project_id),

  CONSTRAINT project_indexing_jobs_status_check CHECK (
    status IN ('pending', 'processing', 'completed', 'failed')
  )
);

CREATE INDEX IF NOT EXISTS project_indexing_jobs_project_id_idx
ON project_indexing_jobs(project_id);

CREATE INDEX IF NOT EXISTS project_indexing_jobs_status_idx
ON project_indexing_jobs(status);