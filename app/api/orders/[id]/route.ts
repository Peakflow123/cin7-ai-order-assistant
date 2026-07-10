import { NextResponse } from 'next/server';import { requireSession } from '@/lib/auth';import { prisma } from '@/lib/db';
export async function GET(_:Request,{params}:{params:{id:string}}){const s=await requireSession();const order=await prisma.order.findFirst({where:{id:params.id,companyId:s.companyId},include:{lines:true}});return NextResponse.json(order);}
