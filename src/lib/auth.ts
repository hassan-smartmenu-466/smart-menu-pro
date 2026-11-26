import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { getDb } from './db';

const COOKIE_NAME = 'smp_admin';
const SESSION_HOURS = 72;

function secret(): string {
  return process.env.SESSION_SECRET || 'dev-insecure-secret-change-me';
}

function expectedUser(): string {
  return process.env.ADMIN_USERNAME || 'admin';
}

function expectedPass(): string {
  return process.env.ADMIN_PASSWORD || 'admin';
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 32).toString('hex');
}

export function verifyCredentials(username: string, password: string): boolean {
  // Constant-time comparison against env-configured credentials.
  const uOk = crypto.timingSafeEqual(
    Buffer.from(username.padEnd(64)), Buffer.from(expectedUser().padEnd(64))
  );
  const salt = crypto.createHash('sha256').update(secret()).digest('hex').slice(0, 16);
  const candidate = hashPassword(password, salt);
  const expected = hashPassword(expectedPass(), salt);
  const pOk = crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(expected));
  return uOk && pOk;
}

export function createSession(): { token: string; expires: Date } {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_HOURS * 3600 * 1000);
  getDb().prepare('INSERT INTO sessions (token, expires_at) VALUES (?, ?)').run(
    token, expires.toISOString()
  );
  return { token, expires };
}

export function destroySession(token: string): void {
  getDb().prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function sessionTokenValid(token: string | undefined): boolean {
  if (!token) return false;
  const row = getDb().prepare('SELECT expires_at FROM sessions WHERE token = ?').get(token) as
    | { expires_at: string }
    | undefined;
  if (!row) return false;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    destroySession(token);
    return false;
  }
  return true;
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return sessionTokenValid(store.get(COOKIE_NAME)?.value);
}

export function cookieName(): string {
  return COOKIE_NAME;
}
