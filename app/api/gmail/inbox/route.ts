import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { listRecentGmailMessages } from '@/lib/gmail';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = requireSession();
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId') || '';
    const maxResults = Math.min(Math.max(Number(searchParams.get('maxResults') || 50), 1), 100);
    const includeNonOrders = searchParams.get('includeNonOrders') === 'true';
    const classify = searchParams.get('classify') === 'true';
    const fromDate = searchParams.get('fromDate') || undefined;
    const toDate = searchParams.get('toDate') || undefined;

    if (!connectionId) return NextResponse.json({ message: 'connectionId is required' }, { status: 400 });

    const messages = await listRecentGmailMessages(connectionId, session.companyId, maxResults, !includeNonOrders, { fromDate, toDate, classify });
    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not load Gmail inbox.' }, { status: 500 });
  }
}
