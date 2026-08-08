'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

type ClientPortalFrameProps = {
  children: ReactNode;
  companyName?: string | null;
  company?: { name?: string | null } | null;
  [key: string]: any;
};

const navigation = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Orders', href: '/orders' },
  { label: 'Review Orders', href: '/mobile' },
  { label: 'Channels', href: '/email' },
  { label: 'Settings', href: '/settings' },
  { label: 'Billing', href: '/billing' }
];

function isActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function ClientPortalFrame(props: ClientPortalFrameProps) {
  const pathname = usePathname();
  const companyName = props.companyName || props.company?.name || 'Client Workspace';

  return (
    <div className="client-app-shell">
      <header className="client-topbar">
        <div className="client-brand-block">
          <img src="/nexorder-logo.svg" alt="NexOrder AI" className="client-brand-logo" />
          <div className="min-w-0">
            <p className="client-brand-title">NexOrder AI</p>
            <p className="client-brand-subtitle truncate">{companyName}</p>
          </div>
        </div>

        <nav className="client-desktop-nav" aria-label="Client navigation">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(pathname, item.href) ? 'client-nav-link client-nav-link-active' : 'client-nav-link'}
            >
              {item.label}
            </Link>
          ))}
          <form action="/api/auth/logout" method="POST">
            <button className="client-logout-button" type="submit">Logout</button>
          </form>
        </nav>
      </header>

      <div className="client-content-with-mobile-nav">
        {props.children}
      </div>

      <nav className="client-mobile-bottom-nav" aria-label="Mobile client navigation">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={isActive(pathname, item.href) ? 'client-mobile-nav-item client-mobile-nav-item-active' : 'client-mobile-nav-item'}
          >
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
