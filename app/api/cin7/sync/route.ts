import { NextResponse } from 'next/server';import { requireSession } from '@/lib/auth';import { syncCin7Products, syncCin7Customers } from '@/lib/cin7';
export async function POST(){const s=await requireSession();const p=await syncCin7Products(s.companyId);const c=await syncCin7Customers(s.companyId);return new NextResponse(`Sync complete. Products: ${p}, Customers: ${c}`);}
