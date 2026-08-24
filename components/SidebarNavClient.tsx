'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: 'home' },
  { href: '/mobile', label: 'Review', icon: 'review' },
  { href: '/orders', label: 'Orders', icon: 'orders' },
  { href: '/email', label: 'Channels', icon: 'channels' },
  { href: '/billing', label: 'Billing', icon: 'billing' },
  { href: '/settings', label: 'Cin7 & Settings', icon: 'settings' }
];

function Icon({ name }: { name: string }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, viewBox: '0 0 24 24' };
  if (name === 'home') return <svg {...p}><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/></svg>;
  if (name === 'review') return <svg {...p}><path d="M9 11.5l2 2L15.5 9"/><path d="M12 3 4.5 6v5.5c0 4.6 3.1 7.8 7.5 9.5 4.4-1.7 7.5-4.9 7.5-9.5V6L12 3Z"/></svg>;
  if (name === 'orders') return <svg {...p}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>;
  if (name === 'channels') return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>;
  if (name === 'billing') return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M7 15h4"/></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06-2.83 2.83A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1.4 1V21h-4v-.09A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.87.34l-2.83-2.83A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1-1.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.5a1.7 1.7 0 0 0-.34-1.87l2.83-2.83A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1.4-1H14v.09A1.7 1.7 0 0 0 15.5 4.6a1.7 1.7 0 0 0 1.87-.34l2.83 2.83A1.7 1.7 0 0 0 19.4 9c.4.98 1.6.98 1.6.98v4s-1.2 0-1.6 1Z"/></svg>;
}

export default function SidebarNavClient() {
  const pathname = usePathname();
  const active = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));
  return (
    <nav className="nx-nav">
      {items.map((it) => (
        <Link key={it.href} href={it.href} className={active(it.href) ? 'active' : ''}>
          <Icon name={it.icon} />
          <span>{it.label}</span>
        </Link>
      ))}
    </nav>
  );
}
