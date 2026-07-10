import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { syncCin7Products, syncCin7Customers } from '@/lib/cin7';

export async function POST() {
  const session = requireSession();
  const products = await syncCin7Products(session.companyId);
  const customers = await syncCin7Customers(session.companyId);
  return new NextResponse(`Sync complete. Products: ${products}, Customers: ${customers}`);
}
