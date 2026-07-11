import './globals.css';
import Link from 'next/link';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const metadata = {
  title: 'NexOrder AI',
  description: 'AI-powered order capture and Cin7 Core sales order automation'
};

async function Header() {
  const session = getSession();
  const admin = isPlatformAdmin(session);

  const company = session?.companyId
    ? await prisma.company.findUnique({
        where: { id: session.companyId },
        select: { name: true }
      })
    : null;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white">N</div>
          <div>
            <p className="text-lg font-bold text-slate-950">NexOrder AI</p>
            <p className="text-xs text-slate-500">{company?.name || 'AI Order Processing'}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {session && <Link className="nav-link" href="/dashboard">Dashboard</Link>}
          {session && <Link className="nav-link" href="/orders">Orders</Link>}
          {session && <Link className="nav-link" href="/orders/new">New Test Order</Link>}
          {session && <Link className="nav-link" href="/email">Input Channels</Link>}
          {session && <Link className="nav-link" href="/settings">Cin7</Link>}
          {admin && <Link className="nav-link" href="/admin">Admin</Link>}
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-slate-50">
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}
