import Link from 'next/link';
import crypto from 'crypto';
import { prisma } from '@/lib/db';

export default async function ResetPasswordPage({ searchParams }: { searchParams?: { token?: string; error?: string } }) {
  const token = (searchParams?.token || '').trim();

  let validToken = false;
  if (token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const record = await prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true }
    });
    validToken = Boolean(record);
  }

  return (
    <main className="page-shell flex min-h-[calc(100vh-120px)] items-center justify-center">
      <section className="card w-full max-w-xl space-y-6">
        <div>
          <h1 className="page-title">Set a new password</h1>
          <p className="page-subtitle">Choose a new password for your NexOrder AI account.</p>
        </div>

        {!validToken ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
              This reset link is invalid or has expired. Please request a new one.
            </div>
            <Link href="/forgot-password" className="btn w-full">Request a new link</Link>
          </div>
        ) : (
          <form className="space-y-4" action="/api/auth/reset-password" method="post">
            <input type="hidden" name="token" value={token} />
            <label className="block">
              <span className="section-label">New password</span>
              <input className="input mt-1" type="password" name="password" autoComplete="new-password" placeholder="Minimum 8 characters" minLength={8} required />
            </label>
            <label className="block">
              <span className="section-label">Confirm new password</span>
              <input className="input mt-1" type="password" name="confirm" autoComplete="new-password" placeholder="Re-enter new password" minLength={8} required />
            </label>
            <button className="btn w-full" type="submit">Update password</button>
          </form>
        )}

        {searchParams?.error && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{searchParams.error}</p>
        )}

        <p className="text-center text-sm text-slate-500">
          <Link href="/login" className="font-bold text-blue-700">Back to login</Link>
        </p>
      </section>
    </main>
  );
}
