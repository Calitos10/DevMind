CREATE TABLE IF NOT EXISTS code_chunks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  project_file_id TEXT NOT NULL REFERENCES project_files(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  start_line INTEGER NOT NULL,
  end_line INTEGER NOT NULL,
  chunk_index INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);