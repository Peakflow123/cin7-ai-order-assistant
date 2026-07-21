import Link from 'next/link';
import '@/app/client-portal.css';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '⌂' },
  { href: '/email', label: 'Channels', icon: '✉' },
  { href: '/orders', label: 'Orders', icon: '▦' },
  { href: '/mobile', label: 'Review', icon: '✓' },
  { href: '/settings', label: 'Settings', icon: '⚙' }
];

export default function ClientPortalFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="client-portal">
      <header className="client-topbar">
        <div className="client-topbar-inner">
          <Link href="/dashboard" className="client-brand">
            <div className="client-brand-mark">N</div>
            <div className="client-brand-text">
              <div className="client-brand-title">NexOrder AI</div>
              <div className="client-brand-subtitle">Order automation workspace</div>
            </div>
          </Link>
          <nav className="client-nav">
            {navItems.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
          </nav>
        </div>
      </header>
      {children}
      <nav className="client-mobile-nav">
        {navItems.map((item) => <Link key={item.href} href={item.href}><span>{item.icon}</span>{item.label}</Link>)}
      </nav>
    </div>
  );
}
