import { AppError } from "./appError";

// Error de dominio que representa que el proveedor de IA (Gemini) no está
// disponible para generar la respuesta tras agotar los reintentos. Se traduce
// a un 503 en la respuesta HTTP de /ask.
export class AnswerProviderUnavailableError extends AppError {
  constructor(cause?: unknown) {
    super(
      "El asistente de IA no está disponible ahora mismo. Vuelve a intentarlo en unos segundos.",
      503,
    );

    // Se conserva el error original por si se quiere registrar para depuración.
    this.cause = cause;
  }
}
