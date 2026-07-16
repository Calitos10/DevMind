import type { PasswordHasher } from "../../src/application/ports/passwordHasher";

export class FakePasswordHasher implements PasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    return `hashed-${plainPassword}`;
  }

  async compare(plainPassword: string, passwordHash: string): Promise<boolean> {
    return passwordHash === `hashed-${plainPassword}`;
  }
}
