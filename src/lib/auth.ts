import 'server-only';
import { cookies, headers } from 'next/headers';
import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { authQuery } from './auth-db';

const COOKIE_NAME = 'autoflow_session';
const SESSION_DAYS = 7;
const MAX_ATTEMPTS = 8;
const WINDOW_MINUTES = 15;

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  role: 'manager' | 'mechanic';
  name: string;
};

type UserRow = AuthUser & { password_hash: string; is_active: boolean };

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

async function requestFingerprint(email: string) {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  return sha256(`${forwarded}:${email.toLowerCase()}`);
}

export async function authenticate(emailInput: string, password: string) {
  const email = emailInput.trim().toLowerCase();
  const key = await requestFingerprint(email);
  const limit = await authQuery<{ attempts: number; window_started_at: Date }>(
    'SELECT attempts, window_started_at FROM auth_login_attempts WHERE fingerprint = $1',
    [key],
  );
  const current = limit.rows[0];
  if (current && current.window_started_at.getTime() > Date.now() - WINDOW_MINUTES * 60_000 && current.attempts >= MAX_ATTEMPTS) {
    return { ok: false as const, reason: 'rate_limited' as const };
  }

  const result = await authQuery<UserRow>(
    'SELECT id, username, email, role, full_name AS name, password_hash, is_active FROM auth_users WHERE email = $1 LIMIT 1',
    [email],
  );
  const user = result.rows[0];
  const valid = Boolean(user?.is_active && await bcrypt.compare(password, user.password_hash));

  if (!valid) {
    await authQuery(
      `INSERT INTO auth_login_attempts (fingerprint, attempts, window_started_at)
       VALUES ($1, 1, NOW())
       ON CONFLICT (fingerprint) DO UPDATE SET
         attempts = CASE WHEN auth_login_attempts.window_started_at < NOW() - INTERVAL '15 minutes'
           THEN 1 ELSE auth_login_attempts.attempts + 1 END,
         window_started_at = CASE WHEN auth_login_attempts.window_started_at < NOW() - INTERVAL '15 minutes'
           THEN NOW() ELSE auth_login_attempts.window_started_at END`,
      [key],
    );
    return { ok: false as const, reason: 'invalid_credentials' as const };
  }

  await authQuery('DELETE FROM auth_login_attempts WHERE fingerprint = $1', [key]);
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await authQuery(
    'INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
    [sha256(token), user.id, expiresAt],
  );
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
  return { ok: true as const, user: toPublicUser(user) };
}

function toPublicUser(user: UserRow): AuthUser {
  return { id: user.id, username: user.username, email: user.email, role: user.role, name: user.name };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const result = await authQuery<UserRow>(
    `SELECT u.id, u.username, u.email, u.role, u.full_name AS name,
            u.password_hash, u.is_active
     FROM auth_sessions s JOIN auth_users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW() AND u.is_active = TRUE
     LIMIT 1`,
    [sha256(token)],
  );
  if (!result.rows[0]) return null;
  return toPublicUser(result.rows[0]);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

export async function requireRole(...roles: AuthUser['role'][]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new Error('FORBIDDEN');
  return user;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) await authQuery('DELETE FROM auth_sessions WHERE token_hash = $1', [sha256(token)]);
  cookieStore.delete(COOKIE_NAME);
}
