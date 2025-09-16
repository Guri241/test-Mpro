// app/api/sessions/[id]/response/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { Prisma } from '@prisma/client'
import { unwrapParams, type RouteCtx } from '@/app/api/_lib/params'

/**
 * 単一回答の upsert
 * body: { itemId: string; value: unknown; note?: string | null }
 */
export async function POST(
  request: NextRequest,
  ctx: RouteCtx<{ id: string }>
) {
  const { id: sessionId } = await unwrapParams(ctx)

  try {
    const body = (await request.json()) as {
      itemId: string
      value: unknown
      note?: string | null
    }

    if (!body?.itemId) {
      return NextResponse.json({ ok: false, error: 'itemId is required' }, { status: 400 })
    }

    const value = JSON.parse(JSON.stringify(body.value)) as Prisma.InputJsonValue

    await prisma.response.upsert({
      where: { sessionId_itemId: { sessionId, itemId: body.itemId } },
      update: { value, remark: body.note ?? null },
      create: { sessionId, itemId: body.itemId, value, remark: body.note ?? null },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message ?? 'unexpected error' },
      { status: 400 }
    )
  }
}

/**
 * 指定セッションの回答一覧
 */
export async function GET(
  _request: NextRequest,
  ctx: RouteCtx<{ id: string }>
) {
  const { id: sessionId } = await unwrapParams(ctx)

  const responses = await prisma.response.findMany({
    where: { sessionId },
    select: { itemId: true, value: true, remark: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ ok: true, responses })
}
