import './globals.css';
import './client-portal.css';
import Link from 'next/link';
import type { Metadata, Viewport } from 'next';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import PWARegister from '@/components/PWARegister';

export const metadata: Metadata = {
  title: 'NexOrder AI',
  description: 'AI-powered Gmail and Outlook order capture, review and Cin7 automation.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'NexOrder AI', statusBarStyle: 'default' }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb'
};

async function Header() {
  const session = getSession();
  const admin = isPlatformAdmin(session);
  const company = session?.companyId ? await prisma.company.findUnique({ where: { id: session.companyId }, select: { name: true } }) : null;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link href={session ? (admin ? '/admin' : '/dashboard') : '/'} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 text-lg font-black text-white shadow-sm">N</div>
          <div>
            <p className="text-lg font-black tracking-tight text-slate-950">NexOrder AI</p>
            <p className="text-xs font-medium text-slate-500">{admin ? 'Platform Admin' : company?.name || 'Order Automation'}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {session && !admin && <Link className="nav-link" href="/dashboard">Dashboard</Link>}
          {session && !admin && <Link className="nav-link" href="/mobile">Review</Link>}
          {session && !admin && <Link className="nav-link" href="/orders">Orders</Link>}
          {session && !admin && <Link className="nav-link" href="/email">Channels</Link>}
          {session && !admin && <Link className="nav-link" href="/settings">Cin7</Link>}
          {admin && <Link className="nav-link" href="/admin">Admin Dashboard</Link>}
          {admin && <Link className="nav-link" href="/admin/clients">Clients</Link>}
          {session ? <form action="/api/auth/logout" method="post"><button className="btn-secondary py-2" type="submit">Logout</button></form> : <Link className="btn py-2" href="/login">Login</Link>}
        </nav>

        {session && admin && <Link href="/admin" className="btn-secondary px-3 py-2 text-sm md:hidden">Admin</Link>}
      </div>
    </header>
  );
}

function MobileTab({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold text-slate-600">
      <span className="text-slate-700">{children}</span>
      <span>{label}</span>
    </Link>
  );
}

async function MobileBottomNav() {
  const session = getSession();
  if (!session || isPlatformAdmin(session)) return null;

  const icon = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex items-stretch border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
      <MobileTab href="/dashboard" label="Dashboard"><svg {...icon}><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/></svg></MobileTab>
      <MobileTab href="/orders" label="Orders"><svg {...icon}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg></MobileTab>
      <MobileTab href="/mobile" label="Review"><svg {...icon}><path d="M9 11.5l2 2L15.5 9"/><path d="M12 3 4.5 6v5.5c0 4.6 3.1 7.8 7.5 9.5 4.4-1.7 7.5-4.9 7.5-9.5V6L12 3Z"/></svg></MobileTab>
      <MobileTab href="/email" label="Channels"><svg {...icon}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg></MobileTab>
      <MobileTab href="/settings" label="Settings"><svg {...icon}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1V21h-4v-.09a1.7 1.7 0 0 0-1.1-1.51 1.7 1.7 0 0 0-1.87.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.5a1.7 1.7 0 0 0-.34-1.87l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1V3h4v.09A1.7 1.7 0 0 0 15.5 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.13.38.34.72.6 1 .28.27.63.47 1 .57h.09v4H21a1.7 1.7 0 0 0-1.6.43Z"/></svg></MobileTab>
    </nav>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PWARegister />
        <div className="min-h-screen pb-20 md:pb-0">
          <Header />
          {children}
        </div>
        <MobileBottomNav />
      </body>
    </html>
  );
}
