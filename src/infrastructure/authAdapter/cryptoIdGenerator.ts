import { randomUUID } from "crypto";
import { IdGenerator } from "../../application/ports/idGenerator";

export class CryptoIdGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}
