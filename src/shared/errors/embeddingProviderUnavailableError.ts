import { AppError } from "./appError";

// Error de dominio que representa que el proveedor de embeddings (Gemini) no está
// disponible tras agotar los reintentos. Se traduce a un 503 en la respuesta HTTP.
export class EmbeddingProviderUnavailableError extends AppError {
  constructor(cause?: unknown) {
    super(
      "Ha habido un problema con el proveedor de embeddings y la indexación ha fallado. Vuelve a lanzar la indexación.",
      503,
    );

    // Se conserva el error original por si se quiere registrar para depuración.
    this.cause = cause;
  }
}
