CREATE TABLE IF NOT EXISTS code_chunk_embeddings (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  code_chunk_id TEXT NOT NULL REFERENCES code_chunks(id) ON DELETE CASCADE,
  embedding vector(768) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT code_chunk_embeddings_code_chunk_id_unique UNIQUE (code_chunk_id)
);

CREATE INDEX IF NOT EXISTS code_chunk_embeddings_project_id_idx
ON code_chunk_embeddings(project_id);

CREATE INDEX IF NOT EXISTS code_chunk_embeddings_code_chunk_id_idx
ON code_chunk_embeddings(code_chunk_id);