import { Pool } from "pg";

import { User } from "../../../domain/entities/user";
import { UserRepository } from "../../../domain/repositories/userRepository";

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
};

export class PostgresUserRepository implements UserRepository {
  constructor(private readonly pool: Pool) {}

  async save(user: User): Promise<User> {
    const result = await this.pool.query<UserRow>(
      `
      INSERT INTO users (id, name, email, password_hash, created_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, password_hash, created_at
      `,
      [user.id, user.name, user.email, user.passwordHash, user.createdAt],
    );

    return this.toDomain(result.rows[0]);
  }

  async saveGuest(user: User, expiresAt: Date): Promise<User> {
    const result = await this.pool.query<UserRow>(
      `
      INSERT INTO users (id, name, email, password_hash, created_at, is_guest, expires_at)
      VALUES ($1, $2, $3, $4, $5, true, $6)
      RETURNING id, name, email, password_hash, created_at
      `,
      [
        user.id,
        user.name,
        user.email,
        user.passwordHash,
        user.createdAt,
        expiresAt,
      ],
    );

    return this.toDomain(result.rows[0]);
  }

  async isGuest(userId: string): Promise<boolean> {
    const result = await this.pool.query<{ is_guest: boolean }>(
      `
      SELECT is_guest
      FROM users
      WHERE id = $1
      `,
      [userId],
    );

    return result.rows[0]?.is_guest === true;
  }

  async deleteExpiredGuests(now: Date): Promise<number> {
    const result = await this.pool.query(
      `
      DELETE FROM users
      WHERE is_guest = true AND expires_at < $1
      `,
      [now],
    );

    return result.rowCount ?? 0;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query<UserRow>(
      `
      SELECT id, name, email, password_hash, created_at
      FROM users
      WHERE email = $1
      `,
      [email],
    );

    const row = result.rows[0];

    if (!row) {
      return null;
    }

    return this.toDomain(row);
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.pool.query<UserRow>(
      `
      SELECT id, name, email, password_hash, created_at
      FROM users
      WHERE id = $1
      `,
      [id],
    );

    const row = result.rows[0];

    if (!row) {
      return null;
    }

    return this.toDomain(row);
  }

  private toDomain(row: UserRow): User {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      createdAt: row.created_at,
    };
  }
}
