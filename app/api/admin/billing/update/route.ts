import { NextResponse } from 'next/server';
import { getSession, isPlatformAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = getSession();
    if (!session || !isPlatformAdmin(session)) return new NextResponse('Unauthorized', { status: 401 });

    const formData = await request.formData();
    const companyId = String(formData.get('companyId') || '');
    const subscriptionStatus = String(formData.get('subscriptionStatus') || 'trialing');
    const planName = String(formData.get('planName') || 'trial');
    const monthlyOrderLimit = Number(formData.get('monthlyOrderLimit') || 100);
    const trialEndsAtValue = String(formData.get('trialEndsAt') || '');
    const trialEndsAt = trialEndsAtValue ? new Date(`${trialEndsAtValue}T23:59:59.000Z`) : null;

    if (!companyId) throw new Error('companyId is required.');

    await prisma.$executeRaw`
      UPDATE "Company"
      SET
        "subscriptionStatus" = ${subscriptionStatus},
        "planName" = ${planName},
        "monthlyOrderLimit" = ${monthlyOrderLimit},
        "trialEndsAt" = COALESCE(${trialEndsAt}, "trialEndsAt")
      WHERE "id" = ${companyId}
    `;

    return NextResponse.redirect(new URL('/admin/billing?saved=1', request.url), { status: 303 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not update billing status.' }, { status: 500 });
  }
}
