import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import DeleteUserButton from './DeleteUserButton';

export default async function AdminUsersPage() {
  const session = getSession();
  if (!session) redirect('/login');
  if (!isPlatformAdmin(session)) redirect('/dashboard');

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { company: { select: { name: true } } }
  });

  return (
    <main className="page-shell space-y-6">
      <section className="hero-card">
        <Link href="/admin" className="text-sm font-bold text-blue-700">← Back to Admin</Link>
        <h1 className="page-title mt-2">Registered Users</h1>
        <p className="page-subtitle">Delete test login accounts from here. The system already prevents duplicate email registration globally.</p>
      </section>

      <section className="card overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="table-head"><tr><th className="px-4 py-3">Email</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Session</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Action</th></tr></thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="table-row">
                <td className="px-4 py-4 font-bold text-slate-950">{user.email}</td>
                <td className="px-4 py-4">{user.name || '-'}</td>
                <td className="px-4 py-4">{user.company.name}</td>
                <td className="px-4 py-4"><span className="badge badge-gray">{user.role}</span></td>
                <td className="px-4 py-4">{user.sessionTimeoutMinutes === 0 ? 'Never' : `${user.sessionTimeoutMinutes} min`}</td>
                <td className="px-4 py-4">{user.createdAt.toLocaleString()}</td>
                <td className="px-4 py-4">{user.id === session.userId ? <span className="text-xs text-slate-500">Current user</span> : <DeleteUserButton userId={user.id} email={user.email} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
