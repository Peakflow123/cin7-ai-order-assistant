import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export type Session = {
  userId: string;
  companyId: string;
  email: string;
};

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
