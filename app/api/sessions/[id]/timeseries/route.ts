// app/api/sessions/[id]/timeseries/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { unwrapParams, type RouteCtx } from '@/app/api/_lib/params'

export async function GET(
  _req: NextRequest,
  ctx: RouteCtx<{ id: string }>
) {
  const { id: sessionId } = await unwrapParams(ctx)

  const samples = await prisma.responseSample.findMany({
    where: { sessionId },
    orderBy: { sampledAt: 'asc' },
    select: { itemId: true, value: true, remark: true, sampledAt: true },
  })

  return NextResponse.json({ ok: true, samples })
}
