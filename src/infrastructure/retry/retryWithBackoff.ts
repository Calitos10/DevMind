import type { Delay } from "../../application/ports/delay";

export type RetryWithBackoffOptions = {
  // Número de reintentos DESPUÉS del primer intento (3 → hasta 4 intentos).
  maxRetries: number;
  // Espera base; crece de forma exponencial (base, base*2, base*4...).
  baseDelayMs: number;
  // Puerto Delay, inyectado para poder testear sin esperas reales.
  delay: Delay;
  // Decide si un error concreto merece reintento (lo aporta quien conoce el error).
  isRetryable: (error: unknown) => boolean;
};

// Utilidad genérica de reintentos con backoff exponencial. No sabe nada del
// proveedor concreto: quien la usa le pasa el predicado `isRetryable` y el Delay.
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryWithBackoffOptions,
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      const canRetry =
        attempt < options.maxRetries && options.isRetryable(error);

      if (!canRetry) {
        throw error;
      }

      const waitMs = options.baseDelayMs * 2 ** attempt;
      await options.delay.wait(waitMs);
      attempt += 1;
    }
  }
}
