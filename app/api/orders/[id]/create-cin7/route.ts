import { NextResponse } from 'next/server';import { requireSession } from '@/lib/auth';import { createCin7Sale } from '@/lib/cin7';
export async function POST(_:Request,{params}:{params:{id:string}}){const s=await requireSession();try{const data=await createCin7Sale(s.companyId,params.id);return NextResponse.json(data);}catch(e:any){return new NextResponse(e.message,{status:500});}}
