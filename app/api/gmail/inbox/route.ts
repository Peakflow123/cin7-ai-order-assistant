import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { listRecentGmailMessages } from '@/lib/gmail';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
 try {
  const session=requireSession(); const {searchParams}=new URL(request.url); const connectionId=searchParams.get('connectionId')||''; const maxResults=Math.min(Math.max(Number(searchParams.get('maxResults')||50),1),100); const includeNonOrders=searchParams.get('includeNonOrders')==='true'; const requestedClassify=searchParams.get('classify')==='true'; const fromDate=searchParams.get('fromDate')||undefined; const toDate=searchParams.get('toDate')||undefined;
  if(!connectionId)return NextResponse.json({message:'connectionId is required'},{status:400});
  const controls=await prisma.$queryRawUnsafe<any[]>(`SELECT COALESCE("allowAiClassificationOnLoad", FALSE) AS "allowAiClassificationOnLoad" FROM "Company" WHERE "id"=$1 LIMIT 1`,session.companyId);
  const classify=requestedClassify&&controls.length>0&&Boolean(controls[0].allowAiClassificationOnLoad);
  const messages=await listRecentGmailMessages(connectionId,session.companyId,maxResults,!includeNonOrders,{fromDate,toDate,classify});
  return NextResponse.json({messages});
 } catch(error) { return NextResponse.json({message:error instanceof Error?error.message:'Could not load Gmail inbox.'},{status:500}); }
}
