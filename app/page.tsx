import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';

export default function HomePage() {
  const session = getSession();
  if (session) redirect(isPlatformAdmin(session) ? '/admin' : '/dashboard');

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_30%),linear-gradient(135deg,#f8fafc,#eef2ff_48%,#ecfeff)] text-slate-950">
      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
        <div>
          <span className="inline-flex rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-sm font-bold text-blue-700 shadow-sm">Built for businesses using Cin7 Core</span>
          <h1 className="mt-7 text-5xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">Turn customer emails and attachments into Cin7 sales orders automatically.</h1>
          <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-600">NexOrder AI reads customer emails, PDFs, spreadsheets, Word files and screenshots, then creates Cin7-ready sales orders so teams spend less time on manual entry and more time serving customers.</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="rounded-2xl bg-blue-600 px-7 py-4 text-center font-black text-white shadow-xl shadow-blue-500/20 transition hover:bg-blue-700" href="/register">Start 15-day free trial</Link>
            <Link className="rounded-2xl border border-slate-200 bg-white px-7 py-4 text-center font-black text-slate-800 shadow-sm transition hover:bg-slate-50" href="/login">Login</Link>
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-500">No credit card required for the trial. Subscribe only if NexOrder AI saves value for your team.</p>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-2xl shadow-slate-300/50 backdrop-blur">
          <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-inner">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm text-slate-400">Incoming customer order</p>
                <p className="font-black">customer-order.pdf</p>
              </div>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-bold text-emerald-300">AI extracted</span>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <div className="rounded-2xl bg-white/10 p-4"><span className="text-slate-400">Customer</span><p className="font-bold">Matched to Cin7 customer</p></div>
              <div className="rounded-2xl bg-white/10 p-4"><span className="text-slate-400">Products</span><p className="font-bold">Matched by SKU, name, aliases and learning history</p></div>
              <div className="rounded-2xl bg-white/10 p-4"><span className="text-slate-400">Result</span><p className="font-bold text-cyan-300">Sales order created in Cin7 Core</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-6 pb-16 md:grid-cols-3">
        {[
          ['Reduce manual order entry', 'Automate repetitive order capture from inboxes and attachments.'],
          ['Process orders faster', 'Move from email to Cin7 sales order in minutes instead of manual retyping.'],
          ['Handle messy formats', 'Emails, PDFs, spreadsheets, Word documents and screenshots.']
        ].map(([title, text]) => (
          <div key={title} className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-sm">
            <h3 className="text-xl font-black">{title}</h3>
            <p className="mt-2 text-slate-600">{text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
