import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { getCompanyBilling, BILLING_PLANS } from '@/lib/billing';

function statusLabel(status: string) {
  if (status === 'trialing') return 'Free trial';
  if (status === 'active') return 'Active subscription';
  if (status === 'trial_expired') return 'Trial expired';
  if (status === 'past_due') return 'Payment past due';
  if (status === 'cancelled') return 'Cancelled';
  return status;
}

export default async function BillingPage() {
  const session = getSession();
  if (!session) redirect('/login');
  if (isPlatformAdmin(session)) redirect('/admin');

  const billing = await getCompanyBilling(session.companyId);
  const usagePercent = Math.min(100, Math.round((billing.ordersThisMonth / Math.max(1, billing.monthlyOrderLimit)) * 100));

  return (
    <main className="page-shell space-y-6">
      <section className="hero-card">
        <Link href="/dashboard" className="text-sm font-bold text-blue-700 hover:text-blue-900">Back to Dashboard</Link>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-label">Billing</p>
            <h1 className="page-title">Plan & Subscription</h1>
            <p className="page-subtitle">Manage your NexOrder AI trial, plan, and monthly order allowance.</p>
          </div>
          <span className="badge badge-blue">{statusLabel(billing.subscriptionStatus)}</span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="section-label">Current plan</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">{BILLING_PLANS[(billing.planName as keyof typeof BILLING_PLANS) || 'trial']?.label || billing.planName}</h2>
          <p className="mt-2 text-sm text-slate-500">{billing.subscriptionStatus === 'trialing' ? `${billing.trialDaysRemaining} trial days remaining` : statusLabel(billing.subscriptionStatus)}</p>
        </div>
        <div className="card">
          <p className="section-label">Orders this month</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">{billing.ordersThisMonth} / {billing.monthlyOrderLimit}</h2>
          <div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-600" style={{ width: `${usagePercent}%` }} /></div>
        </div>
        <div className="card">
          <p className="section-label">Remaining orders</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">{billing.remainingOrders}</h2>
          <p className="mt-2 text-sm text-slate-500">Processing pauses when your monthly limit is reached.</p>
        </div>
      </section>

      {(billing.subscriptionStatus === 'trial_expired' || billing.subscriptionStatus === 'past_due' || billing.subscriptionStatus === 'cancelled') && (
        <section className="card border-amber-200 bg-amber-50 text-amber-900">
          <h2 className="text-xl font-black">Action required</h2>
          <p className="mt-2 text-sm">Your trial or subscription is not active. Choose a plan below to continue processing new orders.</p>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-3">
        {(['starter', 'professional', 'business'] as const).map((plan) => {
          const item = BILLING_PLANS[plan];
          const recommended = plan === 'professional';
          return (
            <div key={plan} className={`card relative flex flex-col ${recommended ? 'border-blue-300 ring-2 ring-blue-100' : ''}`}>
              {recommended && <span className="badge badge-blue absolute right-4 top-4">Most popular</span>}
              <h2 className="text-2xl font-black text-slate-950">{item.label}</h2>
              <p className="mt-2 text-3xl font-black text-blue-700">{item.priceLabel}</p>
              <p className="mt-3 text-sm text-slate-600">{item.description}</p>
              <ul className="mt-5 space-y-2 text-sm text-slate-700">
                <li>• {item.mailboxLabel}</li>
                <li>• {item.monthlyOrderLimit.toLocaleString()} orders/month</li>
                <li>• Gmail and Outlook order intake</li>
                <li>• PDFs, spreadsheets, Word files and screenshot OCR</li>
                <li>• Cin7 Core sales order creation</li>
              </ul>
              <form action="/api/billing/create-checkout" method="POST" className="mt-6">
                <input type="hidden" name="plan" value={plan} />
                <button className={recommended ? 'btn w-full' : 'btn-secondary w-full'} type="submit">Choose {item.label}</button>
              </form>
            </div>
          );
        })}
      </section>

      {billing.stripeCustomerId && (
        <section className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">Manage payment method or invoices</h2>
            <p className="text-sm text-slate-500">Open the secure Stripe billing portal to update card details, view invoices, or manage the subscription.</p>
          </div>
          <form action="/api/billing/portal" method="POST"><button className="btn-secondary" type="submit">Open Billing Portal</button></form>
        </section>
      )}
    </main>
  );
}
