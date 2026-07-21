import Link from 'next/link';

const navItems = [
  { href: '/admin/launch', label: 'Overview', description: 'Main command center' },
  { href: '/admin/launch/clients', label: 'Clients', description: 'Controls and lifecycle' },
  { href: '/admin/launch/usage', label: 'Usage & Storage', description: 'Client usage and capacity' },
  { href: '/admin/launch/activity', label: 'Activity', description: 'Admin action history' },
  { href: '/admin/launch/errors', label: 'Errors', description: 'Failed orders and issues' },
  { href: '/admin/launch/backups', label: 'Backups', description: 'Recovery checklist' },
  { href: '/admin', label: 'Classic Admin', description: 'Existing admin area' }
];

export default function AdminPortalShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex max-w-[1500px] gap-6 px-4 py-6 lg:px-6">
        <aside className="hidden w-80 shrink-0 lg:block">
          <div className="sticky top-6 space-y-4 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="rounded-[1.5rem] bg-gradient-to-br from-blue-700 via-cyan-600 to-emerald-500 p-5 text-white shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/75">NexOrder AI</p>
              <h1 className="mt-2 text-2xl font-black">Admin Portal</h1>
              <p className="mt-2 text-sm text-white/80">One place to manage clients, usage, monitoring and launch readiness.</p>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-2xl border border-transparent px-4 py-3 transition hover:border-blue-100 hover:bg-blue-50">
                  <div className="font-black text-slate-950">{item.label}</div>
                  <div className="text-xs text-slate-500">{item.description}</div>
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <section className="min-w-0 flex-1 space-y-6">
          <header className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">Admin Portal</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{title}</h1>
                <p className="mt-2 max-w-3xl text-slate-600">{subtitle}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                {navItems.slice(0, 6).map((item) => (
                  <Link key={item.href} href={item.href} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-center text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}
