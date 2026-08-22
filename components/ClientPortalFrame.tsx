'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  companyName?: string | null;
};

const desktopNav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/orders', label: 'Orders' },
  { href: '/mobile', label: 'Review Orders' },
  { href: '/email', label: 'Channels' },
  { href: '/settings', label: 'Settings' }
];

const mobileNav = [
  { href: '/dashboard', label: 'Dashboard', icon: 'home' },
  { href: '/orders', label: 'Orders', icon: 'orders' },
  { href: '/mobile', label: 'Review', icon: 'review' },
  { href: '/email', label: 'Channels', icon: 'channels' },
  { href: '/settings', label: 'Settings', icon: 'settings' }
];

function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span className={small ? 'client-brand-mark client-brand-mark-small' : 'client-brand-mark'} aria-hidden="true">
      N
    </span>
  );
}

function NavIcon({ name }: { name: string }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  if (name === 'home') return <svg {...common}><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/></svg>;
  if (name === 'orders') return <svg {...common}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>;
  if (name === 'review') return <svg {...common}><path d="M9 11.5 11 13.5 15.5 9"/><path d="M12 3 4.5 6v5.5c0 4.6 3.1 7.8 7.5 9.5 4.4-1.7 7.5-4.9 7.5-9.5V6L12 3Z"/></svg>;
  if (name === 'channels') return <svg {...common}><path d="M4 5h16v14H4z"/><path d="m4 7 8 6 8-6"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1V21h-4v-.09a1.7 1.7 0 0 0-1.1-1.51 1.7 1.7 0 0 0-1.87.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.5a1.7 1.7 0 0 0-.34-1.87l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1V3h4v.09A1.7 1.7 0 0 0 15.5 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.13.38.34.72.6 1 .28.27.63.47 1 .57h.09v4H21a1.7 1.7 0 0 0-1.6.43Z"/></svg>;
}

export default function ClientPortalFrame({ children, companyName }: Props) {
  const pathname = usePathname();
  const [resolvedCompanyName, setResolvedCompanyName] = useState(companyName?.trim() || '');

  useEffect(() => {
    if (companyName?.trim()) {
      setResolvedCompanyName(companyName.trim());
      return;
    }
    let cancelled = false;
    fetch('/api/company/current', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!cancelled && data?.name) setResolvedCompanyName(String(data.name));
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [companyName]);

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));

  return (
    <div className="client-portal-frame">
      <header className="client-desktop-header">
        <Link href="/dashboard" className="client-brand" aria-label="NexOrder AI dashboard">
          <BrandMark />
          <span className="client-brand-copy">
            <strong>NexOrder AI</strong>
            <span>{resolvedCompanyName || 'Your company'}</span>
          </span>
        </Link>
        <nav className="client-desktop-nav" aria-label="Client navigation">
          {desktopNav.map((item) => (
            <Link key={item.href} href={item.href} className={isActive(item.href) ? 'active' : ''}>{item.label}</Link>
          ))}
          <form action="/api/auth/logout" method="post">
            <button className="logout-button" type="submit">Logout</button>
          </form>
        </nav>
      </header>

      <header className="client-mobile-header">
        <Link href="/dashboard" className="client-brand" aria-label="NexOrder AI dashboard">
          <BrandMark small />
          <span className="client-brand-copy">
            <strong>NexOrder AI</strong>
            <span>{resolvedCompanyName || 'Your company'}</span>
          </span>
        </Link>
      </header>

      <div className="client-portal-content">{children}</div>

      <nav className="client-mobile-bottom-nav" aria-label="Mobile navigation">
        {mobileNav.map((item) => (
          <Link key={item.href} href={item.href} className={isActive(item.href) ? 'active' : ''}>
            <NavIcon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
