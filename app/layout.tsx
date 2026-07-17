import './globals.css';
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

        {session && !admin && <Link href="/mobile" className="btn-secondary px-3 py-2 text-sm md:hidden">Review</Link>}
        {session && admin && <Link href="/admin" className="btn-secondary px-3 py-2 text-sm md:hidden">Admin</Link>}
      </div>
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PWARegister />
        <div className="min-h-screen pb-16 md:pb-0">
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}
