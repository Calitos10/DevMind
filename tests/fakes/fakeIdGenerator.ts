import type { IdGenerator } from "../../src/application/ports/idGenerator";

export class FakeIdGenerator implements IdGenerator {
  constructor(private readonly id: string) {}

  generate(): string {
    return this.id;
  }
}
