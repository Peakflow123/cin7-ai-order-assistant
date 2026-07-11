import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6">
      <section className="card max-w-2xl text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-2xl font-bold text-white">N</div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-950">NexOrder AI</h1>
        <p className="mt-4 text-lg text-slate-600">
          Turn customer emails, PDFs, messages, and order requests into reviewed Cin7 sales orders.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link className="btn" href="/login">Login</Link>
          <Link className="btn-secondary" href="/register">Create Account</Link>
        </div>
      </section>
    </main>
  );
}
