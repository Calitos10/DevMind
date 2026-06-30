import { createHash } from "crypto";

import { FileHashGenerator } from "../../application/ports/fileHashGeneratorPort";

export class CryptoFileHashGenerator implements FileHashGenerator {
  generate(content: string): string {
    return createHash("sha256").update(content).digest("hex");
  }
}