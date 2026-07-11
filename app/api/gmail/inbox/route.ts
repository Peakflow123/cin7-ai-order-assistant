import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { listRecentGmailMessages } from '@/lib/gmail';

export async function GET(request: Request) {
  try {
    const session = requireSession();
    const url = new URL(request.url);
    const connectionId = url.searchParams.get('connectionId');
    const maxResults = Number(url.searchParams.get('maxResults') || 5);
    const includeNonOrders = url.searchParams.get('includeNonOrders') === 'true';

    if (!connectionId) return new NextResponse('connectionId is required', { status: 400 });

    const messages = await listRecentGmailMessages(connectionId, session.companyId, Math.min(8, Math.max(1, maxResults)), !includeNonOrders);
    return NextResponse.json({ messages });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Gmail inbox error';
    return NextResponse.json({ message }, { status: 500 });
  }
}
