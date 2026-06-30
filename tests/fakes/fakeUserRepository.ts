import type { User } from "../../src/domain/entities/user";
import type { UserRepository } from "../../src/domain/repository/userRepository";

export class FakeUserRepository implements UserRepository {
  public users: User[] = [];

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async save(user: User): Promise<User> {
    this.users.push(user);
    return user;
  }
}
