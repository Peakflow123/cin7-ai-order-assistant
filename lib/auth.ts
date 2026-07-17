import { cookies } from 'next/headers';
import crypto from 'crypto';

export type Session = {
  userId: string;
  companyId: string;
  email: string;
  role: string;
  exp?: number;
};

const COOKIE_NAME = 'session';

function secret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret-change-me';
}

function sign(payload: string) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('hex');
}

export function createSessionCookie(session: Omit<Session, 'exp'>, timeoutMinutes: number) {
  const exp = timeoutMinutes > 0 ? Date.now() + timeoutMinutes * 60 * 1000 : 0;
  const payload = Buffer.from(JSON.stringify({ ...session, exp })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function parseCookie(value?: string): Session | null {
  if (!value) return null;
  const [payload, signature] = value.split('.');
  if (!payload || !signature || sign(payload) !== signature) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Session;
    if (session.exp && session.exp > 0 && Date.now() > session.exp) return null;
    return session;
  } catch {
    return null;
  }
}

export function getSession() {
  return parseCookie(cookies().get(COOKIE_NAME)?.value);
}

export function requireSession() {
  const session = getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

export function isPlatformAdmin(session: Session | null) {
  return session?.role === 'ADMIN' || session?.role === 'PLATFORM_ADMIN';
}

export function setSessionCookie(session: Omit<Session, 'exp'>, timeoutMinutes: number) {
  const maxAge = timeoutMinutes > 0 ? timeoutMinutes * 60 : 60 * 60 * 24 * 365;
  cookies().set(COOKIE_NAME, createSessionCookie(session, timeoutMinutes), {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge
  });
}

export function clearSessionCookie() {
  cookies().set(COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 0
  });
}
