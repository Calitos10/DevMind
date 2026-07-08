import type { Delay } from "../../application/ports/delay";

export class TimeoutDelay implements Delay {
  async wait(milliseconds: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}