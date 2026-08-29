import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';

export default function ForgotPasswordPage({ searchParams }: { searchParams?: { sent?: string; error?: string } }) {
  const session = getSession();
  if (session) redirect(isPlatformAdmin(session) ? '/admin' : '/dashboard');

  return (
    <main className="page-shell flex min-h-[calc(100vh-120px)] items-center justify-center">
      <section className="card w-full max-w-xl space-y-6">
        <div>
          <h1 className="page-title">Reset password</h1>
          <p className="page-subtitle">Enter your account email and we will send you a link to set a new password.</p>
        </div>

        {searchParams?.sent === '1' ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            If an account exists for that email, a password reset link has been sent. Please check your inbox (and spam folder). The link expires in 1 hour.
          </div>
        ) : (
          <form className="space-y-4" action="/api/auth/forgot-password" method="post">
            <label className="block">
              <span className="section-label">Email</span>
              <input className="input mt-1" type="email" name="email" autoComplete="email" placeholder="you@company.com" required />
            </label>
            <button className="btn w-full" type="submit">Send reset link</button>
          </form>
        )}

        {searchParams?.error && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{searchParams.error}</p>
        )}

        <p className="text-center text-sm text-slate-500">
          Remembered it? <Link href="/login" className="font-bold text-blue-700">Back to login</Link>
        </p>
      </section>
    </main>
  );
}
