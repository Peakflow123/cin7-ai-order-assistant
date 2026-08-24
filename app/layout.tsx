import './globals.css';
import './client-portal.css';
import Link from 'next/link';
import type { Metadata, Viewport } from 'next';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import PWARegister from '@/components/PWARegister';
import SidebarNavClient from '@/components/SidebarNavClient';
import MobileNavClient from '@/components/MobileNavClient';

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
  themeColor: '#0B1220'
};

function SimpleHeader({ admin, session, companyName }: { admin: boolean; session: any; companyName?: string | null }) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link href={session ? (admin ? '/admin' : '/dashboard') : '/'} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3452FF] text-lg font-black text-white">N</div>
          <div>
            <p className="text-lg font-black tracking-tight text-slate-950">NexOrder AI</p>
            <p className="text-xs font-medium text-slate-500">{admin ? 'Platform Admin' : companyName || 'Order Automation'}</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {admin && <Link className="nav-link" href="/admin">Admin Dashboard</Link>}
          {admin && <Link className="nav-link" href="/admin/clients">Clients</Link>}
          {admin && <Link className="nav-link" href="/admin/billing">Billing</Link>}
          {session ? <form action="/api/auth/logout" method="post"><button className="btn-secondary py-2" type="submit">Logout</button></form> : <Link className="btn py-2" href="/login">Login</Link>}
        </nav>
        {session && admin && <Link href="/admin" className="btn-secondary px-3 py-2 text-sm md:hidden">Admin</Link>}
      </div>
    </header>
  );
}

async function Shell({ children }: { children: React.ReactNode }) {
  const session = getSession();
  const admin = isPlatformAdmin(session);
  const company = session?.companyId ? await prisma.company.findUnique({ where: { id: session.companyId }, select: { name: true } }) : null;

  // Client workspace -> sidebar shell
  if (session && !admin) {
    return (
      <div className="nx-app">
        <aside className="nx-sidebar">
          <Link href="/dashboard" className="nx-brand">
            <div className="nx-brand-mark">N</div>
            <div>
              <div className="nx-brand-title">NexOrder AI</div>
              <div className="nx-brand-sub">Order Automation</div>
            </div>
          </Link>

          <div className="nx-workspace">
            <span className="nx-workspace-label">Workspace</span>
            {company?.name || 'Client'}
          </div>

          <SidebarNavClient />

          <div className="nx-sidebar-foot">
            <div className="nx-status"><span className="nx-status-dot" /> Cin7 connected</div>
            <form action="/api/auth/logout" method="post" className="nx-logout">
              <button type="submit">Logout</button>
            </form>
          </div>
        </aside>

        <div className="nx-content">
          <header className="nx-mobile-topbar">
            <div className="nx-brand-mark">N</div>
            <div>
              <div className="nx-mobile-title">NexOrder AI</div>
              <div className="nx-mobile-sub">{company?.name || 'Order Automation'}</div>
            </div>
          </header>
          {children}
        </div>

        <MobileNavClient />
      </div>
    );
  }

  // Admin + logged-out -> simple top header
  return (
    <div className="min-h-screen">
      <SimpleHeader admin={admin} session={session} companyName={company?.name} />
      {children}
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PWARegister />
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
