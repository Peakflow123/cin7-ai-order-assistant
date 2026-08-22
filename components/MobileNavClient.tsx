'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/dashboard', label: 'Dashboard', icon: 'home' },
  { href: '/orders', label: 'Orders', icon: 'orders' },
  { href: '/mobile', label: 'Review', icon: 'review' },
  { href: '/email', label: 'Channels', icon: 'channels' },
  { href: '/billing', label: 'Billing', icon: 'billing' },
  { href: '/settings', label: 'Settings', icon: 'settings' }
];

function Icon({ name }: { name: string }) {
  const p = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'home') return <svg {...p}><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/></svg>;
  if (name === 'orders') return <svg {...p}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>;
  if (name === 'review') return <svg {...p}><path d="M9 11.5l2 2L15.5 9"/><path d="M12 3 4.5 6v5.5c0 4.6 3.1 7.8 7.5 9.5 4.4-1.7 7.5-4.9 7.5-9.5V6L12 3Z"/></svg>;
  if (name === 'channels') return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>;
  if (name === 'billing') return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M7 15h4"/></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1V21h-4v-.09a1.7 1.7 0 0 0-1.1-1.51 1.7 1.7 0 0 0-1.87.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.5a1.7 1.7 0 0 0-.34-1.87l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1V3h4v.09A1.7 1.7 0 0 0 15.5 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.13.38.34.72.6 1 .28.27.63.47 1 .57h.09v4H21a1.7 1.7 0 0 0-1.6.43Z"/></svg>;
}

export default function MobileNavClient() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)', paddingTop: 8 }}
      aria-label="Mobile navigation"
    >
      <div className="mx-auto flex max-w-xl items-stretch px-1">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`mx-0.5 flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}
            >
              <span className={active ? 'text-blue-600' : 'text-slate-600'}><Icon name={tab.icon} /></span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
