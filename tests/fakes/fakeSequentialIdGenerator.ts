import type { IdGenerator } from "../../src/application/ports/idGeneratorPort";

export class FakeSequentialIdGenerator implements IdGenerator {
  private currentIndex = 0;

  constructor(private readonly ids: string[]) {}

  generate(): string {
    const id = this.ids[this.currentIndex];

    if (!id) {
      throw new Error("No fake ids left");
    }

    this.currentIndex += 1;

    return id;
  }
}
