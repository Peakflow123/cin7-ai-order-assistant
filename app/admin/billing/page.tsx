import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import AdminPortalShell from '../launch/AdminPortalShell';

export default async function AdminBillingPage() {
  const session = getSession();
  if (!session) redirect('/login');
  if (!isPlatformAdmin(session)) redirect('/dashboard');

  const companies = await prisma.$queryRaw<Array<{
    id: string;
    name: string;
    subscriptionStatus: string;
    planName: string;
    monthlyOrderLimit: number;
    trialEndsAt: Date;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    ordersThisMonth: bigint;
  }>>`
    SELECT
      c."id",
      c."name",
      c."subscriptionStatus"::text AS "subscriptionStatus",
      c."planName",
      c."monthlyOrderLimit",
      c."trialEndsAt",
      c."stripeCustomerId",
      c."stripeSubscriptionId",
      COUNT(o."id")::bigint AS "ordersThisMonth"
    FROM "Company" c
    LEFT JOIN "Order" o ON o."companyId" = c."id" AND o."createdAt" >= date_trunc('month', CURRENT_DATE)
    GROUP BY c."id"
    ORDER BY c."createdAt" DESC
  `;

  return (
    <AdminPortalShell title="Billing & Trials" subtitle="Control trial access, subscription status, plans and monthly order limits for each client.">
      <section className="grid gap-4">
        {companies.map((company) => (
          <form key={company.id} action="/api/admin/billing/update" method="POST" className="card grid gap-4 lg:grid-cols-[1fr_160px_160px_160px_180px_auto] lg:items-end">
            <input type="hidden" name="companyId" value={company.id} />
            <div>
              <h2 className="text-xl font-black text-slate-950">{company.name}</h2>
              <p className="mt-1 text-sm text-slate-500">Orders this month: {Number(company.ordersThisMonth)} / {company.monthlyOrderLimit}</p>
              <p className="mt-1 text-xs text-slate-400">Stripe customer: {company.stripeCustomerId || 'Not linked'} | Subscription: {company.stripeSubscriptionId || 'Not linked'}</p>
            </div>
            <label>
              <span className="section-label">Status</span>
              <select className="input mt-1" name="subscriptionStatus" defaultValue={company.subscriptionStatus}>
                <option value="trialing">Trialing</option>
                <option value="active">Active</option>
                <option value="trial_expired">Trial Expired</option>
                <option value="past_due">Past Due</option>
                <option value="cancelled">Cancelled</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
            <label>
              <span className="section-label">Plan</span>
              <select className="input mt-1" name="planName" defaultValue={company.planName}>
                <option value="trial">Trial</option>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="business">Business</option>
              </select>
            </label>
            <label>
              <span className="section-label">Monthly limit</span>
              <input className="input mt-1" type="number" name="monthlyOrderLimit" defaultValue={company.monthlyOrderLimit} min="1" />
            </label>
            <label>
              <span className="section-label">Trial ends</span>
              <input className="input mt-1" type="date" name="trialEndsAt" defaultValue={company.trialEndsAt ? company.trialEndsAt.toISOString().slice(0, 10) : ''} />
            </label>
            <button className="btn" type="submit">Save</button>
          </form>
        ))}
      </section>
    </AdminPortalShell>
  );
}
