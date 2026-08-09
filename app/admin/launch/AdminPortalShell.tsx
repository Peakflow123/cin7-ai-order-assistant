'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
};

const nav = [
  { label: 'Control Center', href: '/admin/launch' },
  { label: 'Clients', href: '/admin/launch/clients' },
  { label: 'Billing', href: '/admin/billing' },
  { label: 'Usage & Storage', href: '/admin/launch/usage' },
  { label: 'Activity', href: '/admin/launch/activity' },
  { label: 'Errors', href: '/admin/launch/errors' },
  { label: 'Backups', href: '/admin/launch/backups' }
];

function isActive(pathname: string, href: string) {
  if (href === '/admin/launch') return pathname === '/admin/launch';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function AdminBrandMark() {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-500 to-emerald-500 text-lg font-black text-white shadow-sm">
      N
    </div>
  );
}

export default function AdminPortalShell({ children, title, subtitle }: Props) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6 lg:self-start">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <AdminBrandMark />
            <div className="min-w-0">
              <p className="text-lg font-black leading-tight text-slate-950">NexOrder AI</p>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Admin Control Center</p>
            </div>
          </div>

          <nav className="mt-5 grid gap-2" aria-label="Admin control center navigation">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={isActive(pathname, item.href)
                  ? 'rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-sm'
                  : 'rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950'}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <form action="/api/auth/logout" method="POST" className="mt-5 border-t border-slate-100 pt-5">
            <button className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50" type="submit">Logout</button>
          </form>
        </aside>

        <section className="min-w-0">
          {(title || subtitle) && (
            <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              {title && <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">{title}</h1>}
              {subtitle && <p className="mt-3 max-w-3xl text-base text-slate-600 md:text-lg">{subtitle}</p>}
            </section>
          )}
          {children}
        </section>
      </div>
    </main>
  );
}
