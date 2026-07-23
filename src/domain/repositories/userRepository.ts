import { User } from "../entities/user";

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
  // Indica si el usuario es un invitado (is_guest = true).
  isGuest(userId: string): Promise<boolean>;
  // Guarda un usuario como invitado temporal (is_guest = true) con su caducidad.
  saveGuest(user: User, expiresAt: Date): Promise<User>;
  // Borra los invitados cuya caducidad ya pasó; devuelve cuántos borró.
  // Al borrar el usuario, las cascadas de la BD arrastran todos sus datos.
  deleteExpiredGuests(now: Date): Promise<number>;
}
