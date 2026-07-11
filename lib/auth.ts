import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export type Session = {
  userId: string;
  companyId: string;
  email: string;
  role?: string;
};

export function isPlatformAdminEmail(email: string) {
  const adminEmails = (process.env.PLATFORM_ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(email.trim().toLowerCase());
}

export function signSession(session: Session) {
  return jwt.sign(session, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
}

export function getSession(): Session | null {
  const token = cookies().get('session')?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as Session;
  } catch {
    return null;
  }
}

export function requireSession() {
  const session = getSession();
  if (!session) throw new Error('Not authenticated');
  return session;
}

export function isPlatformAdmin(session: Session | null) {
  if (!session) return false;
  return session.role === 'PLATFORM_ADMIN' || isPlatformAdminEmail(session.email);
}

export function requirePlatformAdmin() {
  const session = requireSession();
  if (!isPlatformAdmin(session)) throw new Error('Not authorised');
  return session;
}
