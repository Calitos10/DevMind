import "dotenv/config";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

export const env = {
  port: process.env.PORT || "3000",
  nodeEnv: process.env.NODE_ENV || "development",
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  upload: {
    maxZipSizeMb: Number(process.env.MAX_ZIP_SIZE_MB) || 200,
    maxZipUncompressedSizeMb:
      Number(process.env.MAX_ZIP_UNCOMPRESSED_SIZE_MB) || 1000,
  },
  authRateLimit: {
    max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
    windowMinutes: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES) || 15,
  },
  // Límite para /ask: cada pregunta genera un embedding y llama a Gemini,
  // así que tiene coste real. Se limita por usuario autenticado.
  askRateLimit: {
    max: Number(process.env.ASK_RATE_LIMIT_MAX) || 20,
    windowMinutes: Number(process.env.ASK_RATE_LIMIT_WINDOW_MINUTES) || 15,
  },
  // Límite para /upload: subir un ZIP consume CPU/memoria y dispara indexación.
  uploadRateLimit: {
    max: Number(process.env.UPLOAD_RATE_LIMIT_MAX) || 10,
    windowMinutes: Number(process.env.UPLOAD_RATE_LIMIT_WINDOW_MINUTES) || 60,
  },
  indexing: {
    delayBetweenChunksMs:
      Number(process.env.INDEXING_DELAY_BETWEEN_CHUNKS_MS) || 1000,
  },
  // Reintentos ante fallos transitorios del proveedor de embeddings (503/429).
  embedding: {
    maxRetries: Number(process.env.EMBEDDING_MAX_RETRIES) || 3,
    retryBaseMs: Number(process.env.EMBEDDING_RETRY_BASE_MS) || 1000,
  },
  rag: {
    // Distancia máxima (operador <-> de pgvector, L2) que se acepta para
    // considerar que un chunk es relevante. Los chunks más lejanos que este
    // umbral se descartan; si no queda ninguno, se responde "sin información".
    // Es un punto de partida y debe calibrarse con preguntas reales.
    maxDistance: Number(process.env.RAG_MAX_DISTANCE) || 1.0,
  },
};
