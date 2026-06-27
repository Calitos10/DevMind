import bcrypt from "bcryptjs";
import { PasswordHasher } from "../../application/ports/passwordHasherPort";

export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly saltRounds: number = 10) {}

  async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, this.saltRounds);
  }

  async compare(plainPassword: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, passwordHash);
  }
}