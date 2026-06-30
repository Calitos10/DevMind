import { Pool } from "pg";

import { User } from "../../../domain/entities/user";
import { UserRepository } from "../../../domain/repository/userRepository";

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
