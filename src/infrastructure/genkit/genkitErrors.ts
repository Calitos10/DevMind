// Detecta si un error de Genkit/Gemini es transitorio (merece reintento):
// 503 Service Unavailable (UNAVAILABLE) o 429 Too Many Requests (RESOURCE_EXHAUSTED).
// Se comprueban varias formas del error para ser robustos ante cambios de la librería.
// Vive en un módulo compartido porque lo usan tanto el generador de embeddings
// como el generador de respuestas.
export function isTransientGenkitError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as {
    status?: unknown;
    code?: unknown;
    message?: unknown;
  };

  const status = typeof candidate.status === "string" ? candidate.status : "";
  const code = candidate.code;
  const message =
    typeof candidate.message === "string" ? candidate.message : "";

  if (status === "UNAVAILABLE" || status === "RESOURCE_EXHAUSTED") {
    return true;
  }

  if (code === 503 || code === 429) {
    return true;
  }

  return (
    message.includes("503") ||
    message.includes("429") ||
    message.includes("UNAVAILABLE") ||
    message.includes("RESOURCE_EXHAUSTED")
  );
}
