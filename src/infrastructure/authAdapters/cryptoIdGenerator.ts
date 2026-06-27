import { randomUUID } from "crypto";
import { IdGenerator } from "../../application/ports/idGeneratorPort";

export class CryptoIdGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}
