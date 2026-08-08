'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

type AdminPortalShellProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  [key: string]: any;
};

const adminNavigation = [
  { label: 'Control Center', href: '/admin/launch' },
  { label: 'Clients', href: '/admin/launch/clients' },
  { label: 'Billing', href: '/admin/billing' },
  { label: 'Usage & Storage', href: '/admin/launch/usage' },
  { label: 'Activity', href: '/admin/launch/activity' },
  { label: 'Errors', href: '/admin/launch/errors' },
  { label: 'Backups', href: '/admin/launch/backups' }
];

function isActive(pathname: string, href: string) {
  if (href === '/admin/launch') return pathname === '/admin/launch';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminPortalShell({ children, title, subtitle }: AdminPortalShellProps) {
  const pathname = usePathname();

  return (
    <main className="page-shell admin-portal-shell">
      <section className="admin-portal-layout">
        <aside className="admin-portal-sidebar">
          <div className="admin-portal-brand">
            <img src="/nexorder-logo.svg" alt="NexOrder AI" className="client-brand-logo" />
            <div>
              <p className="client-brand-title">NexOrder AI</p>
              <p className="client-brand-subtitle">Admin Control Center</p>
            </div>
          </div>

          <nav className="admin-portal-nav" aria-label="Admin control center navigation">
            {adminNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={isActive(pathname, item.href) ? 'admin-portal-nav-link admin-portal-nav-link-active' : 'admin-portal-nav-link'}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <form action="/api/auth/logout" method="POST" className="mt-4">
            <button className="client-logout-button w-full" type="submit">Logout</button>
          </form>
        </aside>

        <section className="admin-portal-main">
          {(title || subtitle) && (
            <div className="hero-card mb-6">
              {title && <h1 className="page-title">{title}</h1>}
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
          )}
          {children}
        </section>
      </section>
    </main>
  );
}
