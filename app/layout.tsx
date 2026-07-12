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
    ? await prisma.company.findUnique({ where: { id: session.companyId }, select: { name: true } })
    : null;

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href={session ? '/dashboard' : '/'} className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-500 to-violet-600 text-lg font-black text-white shadow-lg shadow-blue-500/20">N</div>
          <div>
            <p className="text-lg font-black tracking-tight text-slate-950">NexOrder AI</p>
            <p className="text-xs font-medium text-slate-500">{company?.name || 'AI Order Processing'}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {session && <Link className="nav-link" href="/dashboard">Dashboard</Link>}
          {session && <Link className="nav-link" href="/orders">Orders</Link>}
          {session && <Link className="nav-link" href="/orders/new">New Order</Link>}
          {session && <Link className="nav-link" href="/email">Channels</Link>}
          {session && <Link className="nav-link" href="/settings">Cin7</Link>}
          {admin && <Link className="nav-link" href="/admin">Admin</Link>}
          {session ? (
            <form action="/api/auth/logout" method="post">
              <button className="btn-secondary py-2.5" type="submit">Logout</button>
            </form>
          ) : (
            <Link className="btn py-2.5" href="/login">Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}
