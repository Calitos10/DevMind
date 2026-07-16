import { User } from "../../../domain/entities/user";
import { UserRepository } from "../../../domain/repositories/userRepository";

export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async save(user: User): Promise<User> {
    this.users.push(user);
    return user;
  }
}
