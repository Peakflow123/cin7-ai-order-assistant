import Link from 'next/link';
import '@/app/client-portal.css';

const desktopNav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/orders', label: 'Orders' },
  { href: '/mobile', label: 'Review Orders' },
  { href: '/email', label: 'Channels' },
  { href: '/settings', label: 'Settings' }
];

const mobileNav = [
  { href: '/dashboard', label: 'Dashboard', icon: '⌂' },
  { href: '/orders', label: 'Orders', icon: '▦' },
  { href: '/mobile', label: 'Review', icon: '✓' },
  { href: '/email', label: 'Channels', icon: '✉' },
  { href: '/settings', label: 'Settings', icon: '⚙' }
];

export default function ClientPortalFrame({ children, companyName }: { children: React.ReactNode; companyName?: string | null }) {
  return (
    <div className="client-portal">
      <header className="client-topbar">
        <div className="client-topbar-inner">
          <Link href="/dashboard" className="client-brand">
            <div className="client-brand-mark">N</div>
            <div className="client-brand-text">
              <div className="client-brand-title">NexOrder AI</div>
              <div className="client-brand-subtitle">{companyName || 'Order automation workspace'}</div>
            </div>
          </Link>
          <nav className="client-nav">
            {desktopNav.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
            <form action="/api/auth/logout" method="post">
              <button className="logout-button" type="submit">Logout</button>
            </form>
          </nav>
        </div>
      </header>
      {children}
      <nav className="client-mobile-nav">
        {mobileNav.map((item) => <Link key={item.href} href={item.href}><span>{item.icon}</span>{item.label}</Link>)}
      </nav>
    </div>
  );
}
