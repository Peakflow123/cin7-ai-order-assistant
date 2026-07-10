import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
export type Session = { userId: string; companyId: string; email: string };
export function signSession(s: Session) { return jwt.sign(s, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' }); }
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get('session')?.value;
  if (!token) return null;
  try { return jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as Session; } catch { return null; }
}
export async function requireSession() {
  const s = await getSession();
  if (!s) throw new Error('Not authenticated');
  return s;
}
