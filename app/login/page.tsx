import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';

export default function LoginPage({ searchParams }: { searchParams?: { error?: string } }) {
  const session = getSession();
  if (session) redirect(isPlatformAdmin(session) ? '/admin' : '/dashboard');

  return (
    <main className="page-shell flex min-h-[calc(100vh-120px)] items-center justify-center">
      <section className="card w-full max-w-xl space-y-6">
        <div>
          <h1 className="page-title">Login</h1>
          <p className="page-subtitle">Access your NexOrder AI workspace.</p>
        </div>

        <form className="space-y-4" action="/api/auth/login" method="post">
          <label className="block">
            <span className="section-label">Email</span>
            <input
              className="input mt-1"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@company.com"
              required
            />
          </label>

          <label className="block">
            <span className="section-label">Password</span>
            <input
              className="input mt-1"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Your password"
              required
            />
          </label>

          <button className="btn w-full" type="submit">Login</button>
        </form>

        {searchParams?.error && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
            {searchParams.error}
          </p>
        )}

        <p className="text-center text-sm text-slate-500">
          Need an account? <Link href="/register" className="font-bold text-blue-700">Create one</Link>
        </p>
      </section>
    </main>
  );
}
