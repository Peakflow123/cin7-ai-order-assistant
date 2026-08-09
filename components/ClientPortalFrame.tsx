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

function BrandMark({ size = 'small' }: { size?: 'small' | 'large' }) {
  const sizeClass = size === 'large' ? 'h-12 w-12 text-xl' : 'h-10 w-10 text-lg';
  return (
    <div className={`${sizeClass} flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-500 to-emerald-500 font-black text-white shadow-sm`}>
      N
    </div>
  );
}

export default function ClientPortalFrame(props: ClientPortalFrameProps) {
  const pathname = usePathname();
  const companyName = props.companyName || props.company?.name || 'Client Workspace';

  return (
    <div>
      {/* Desktop already has the main top header from the app layout. Do not render a second desktop header here. */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div className="min-w-0">
            <p className="truncate text-base font-black leading-tight text-slate-950">NexOrder AI</p>
            <p className="truncate text-xs font-bold text-slate-500">{companyName}</p>
          </div>
        </div>
      </header>

      <div className="pb-24 md:pb-0">{props.children}</div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-6 border-t border-slate-200 bg-white/95 px-1 py-2 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur md:hidden" aria-label="Mobile client navigation">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={isActive(pathname, item.href)
              ? 'rounded-2xl bg-blue-50 px-1 py-2 text-center text-[10px] font-black leading-tight text-blue-700'
              : 'rounded-2xl px-1 py-2 text-center text-[10px] font-bold leading-tight text-slate-500'}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
