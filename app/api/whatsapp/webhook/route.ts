import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'WhatsApp channel is disabled in this NexOrder AI version.' }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ message: 'WhatsApp channel is disabled in this NexOrder AI version.' }, { status: 410 });
}
