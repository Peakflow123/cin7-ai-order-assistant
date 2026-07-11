import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth';
import { syncCin7Customers, syncCin7Products } from '@/lib/cin7';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  requirePlatformAdmin();
  const products = await syncCin7Products(params.id);
  const customers = await syncCin7Customers(params.id);
  return new NextResponse(`Refresh complete. Products: ${products}, Customers: ${customers}`);
}
