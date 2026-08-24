'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/dashboard', label: 'Dashboard', icon: 'home' },
  { href: '/mobile', label: 'Review', icon: 'review' },
  { href: '/orders', label: 'Orders', icon: 'orders' },
  { href: '/email', label: 'Channels', icon: 'channels' },
  { href: '/settings', label: 'More', icon: 'more' }
];

function Icon({ name }: { name: string }) {
  const p = { width: 20, height: 20, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, viewBox: '0 0 24 24' };
  if (name === 'home') return <svg {...p}><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/></svg>;
  if (name === 'review') return <svg {...p}><path d="M9 11.5l2 2L15.5 9"/><path d="M12 3 4.5 6v5.5c0 4.6 3.1 7.8 7.5 9.5 4.4-1.7 7.5-4.9 7.5-9.5V6L12 3Z"/></svg>;
  if (name === 'orders') return <svg {...p}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>;
  if (name === 'channels') return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>;
  return <svg {...p}><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>;
}

export default function MobileNavClient() {
  const pathname = usePathname();
  const active = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)', paddingTop: 8 }}
      aria-label="Mobile navigation"
    >
      <div className="mx-auto flex max-w-xl items-stretch px-1">
        {tabs.map((t) => {
          const on = active(t.href);
          return (
            <Link key={t.href} href={t.href} className={`mx-0.5 flex flex-1 flex-col items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-bold transition ${on ? 'bg-[#EEF1FF] text-[#1E3AC7]' : 'text-slate-600'}`}>
              <span className={on ? 'text-[#3452FF]' : 'text-slate-600'}><Icon name={t.icon} /></span>
              <span>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
