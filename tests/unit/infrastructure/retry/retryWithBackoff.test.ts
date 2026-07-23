import { describe, expect, it, vi } from "vitest";

import type { Delay } from "../../../../src/application/ports/delay";
import { retryWithBackoff } from "../../../../src/infrastructure/retry/retryWithBackoff";

// Delay falso: registra las esperas pero resuelve al instante, para que los
// tests no esperen de verdad.
class FakeDelay implements Delay {
  public waits: number[] = [];

  async wait(milliseconds: number): Promise<void> {
    this.waits.push(milliseconds);
  }
}

const retryAll = () => true;

describe("retryWithBackoff", () => {
  it("returns the result on the first try without waiting", async () => {
    const delay = new FakeDelay();
    const operation = vi.fn().mockResolvedValue("ok");

    const result = await retryWithBackoff(operation, {
      maxRetries: 3,
      baseDelayMs: 1000,
      delay,
      isRetryable: retryAll,
    });

    expect(result).toBe("ok");
    expect(operation).toHaveBeenCalledTimes(1);
    expect(delay.waits).toEqual([]);
  });

  it("retries with exponential backoff and succeeds", async () => {
    const delay = new FakeDelay();
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error("transient"))
      .mockRejectedValueOnce(new Error("transient"))
      .mockResolvedValue("ok");

    const result = await retryWithBackoff(operation, {
      maxRetries: 3,
      baseDelayMs: 1000,
      delay,
      isRetryable: retryAll,
    });

    expect(result).toBe("ok");
    expect(operation).toHaveBeenCalledTimes(3);
    expect(delay.waits).toEqual([1000, 2000]);
  });

  it("gives up after exhausting the retries and rethrows the last error", async () => {
    const delay = new FakeDelay();
    const operation = vi.fn().mockRejectedValue(new Error("still failing"));

    await expect(
      retryWithBackoff(operation, {
        maxRetries: 3,
        baseDelayMs: 1000,
        delay,
        isRetryable: retryAll,
      }),
    ).rejects.toThrow("still failing");

    // 1 intento inicial + 3 reintentos = 4 llamadas
    expect(operation).toHaveBeenCalledTimes(4);
    expect(delay.waits).toEqual([1000, 2000, 4000]);
  });

  it("does not retry when the error is not retryable", async () => {
    const delay = new FakeDelay();
    const operation = vi.fn().mockRejectedValue(new Error("fatal"));

    await expect(
      retryWithBackoff(operation, {
        maxRetries: 3,
        baseDelayMs: 1000,
        delay,
        isRetryable: () => false,
      }),
    ).rejects.toThrow("fatal");

    expect(operation).toHaveBeenCalledTimes(1);
    expect(delay.waits).toEqual([]);
  });
});
