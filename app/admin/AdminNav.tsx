import Link from 'next/link';

const items = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/clients', label: 'Clients & Controls' },
  { href: '/admin/storage', label: 'Storage Usage' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/activity', label: 'Activity' },
  { href: '/admin/logs', label: 'Logs' }
];

export default function AdminNav({ active }: { active: string }) {
  return (
    <aside className="admin-sidebar space-y-5">
      <div>
        <p className="badge badge-blue">Platform control</p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Admin</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Separate admin workspace for launch operations.</p>
      </div>
      <nav className="space-y-2">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className={active === item.href ? 'nav-link-active block' : 'nav-link block'}>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
