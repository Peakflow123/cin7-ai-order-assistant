import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Cin7 AI Order Assistant',
  description: 'AI-powered Cin7 Core order capture and review tool'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-slate-50">
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white">N</div>
                <div>
                  <p className="text-lg font-bold text-slate-950">Cin7 AI Order Assistant</p>
                  <p className="text-xs text-slate-500">Nexvista Consulting</p>
                </div>
              </Link>
              <nav className="hidden items-center gap-2 md:flex">
                <Link className="nav-link" href="/dashboard">Dashboard</Link>
                <Link className="nav-link" href="/orders">Orders</Link>
                <Link className="nav-link" href="/orders/new">New Test Order</Link>
                <Link className="nav-link" href="/settings">Cin7</Link>
                <Link className="nav-link" href="/admin">Admin</Link>
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
