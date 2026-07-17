import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ message: 'WhatsApp channel is disabled in this NexOrder AI version.' }, { status: 410 });
}
