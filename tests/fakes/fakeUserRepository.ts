import type { User } from "../../src/domain/entities/user";
import type { UserRepository } from "../../src/domain/repositories/userRepository";

export class FakeUserRepository implements UserRepository {
  public users: User[] = [];
  // Guarda, para los invitados, su fecha de caducidad (paralelo a `users`).
  public savedGuests: Array<{ user: User; expiresAt: Date }> = [];

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

  async isGuest(userId: string): Promise<boolean> {
    return this.savedGuests.some((guest) => guest.user.id === userId);
  }

  async saveGuest(user: User, expiresAt: Date): Promise<User> {
    this.users.push(user);
    this.savedGuests.push({ user, expiresAt });
    return user;
  }

  async deleteExpiredGuests(now: Date): Promise<number> {
    const expired = this.savedGuests.filter(
      (guest) => guest.expiresAt.getTime() < now.getTime(),
    );

    const expiredIds = new Set(expired.map((guest) => guest.user.id));

    this.users = this.users.filter((user) => !expiredIds.has(user.id));
    this.savedGuests = this.savedGuests.filter(
      (guest) => !expiredIds.has(guest.user.id),
    );

    return expired.length;
  }
}
