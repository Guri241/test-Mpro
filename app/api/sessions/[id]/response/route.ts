// app/api/sessions/[id]/response/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { Prisma } from '@prisma/client'

/**
 * 指定セッションの単一回答を upsert するAPI（itemId, value を受け取る）
 * body: { itemId: string; value: unknown; note?: string | null }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } } // ← Promiseではない
) {
  const { id: sessionId } = params
  try {
    const body = await request.json() as { itemId: string; value: unknown; note?: string | null }
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
 * 指定セッションの回答一覧を返す
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: sessionId } = params
  const responses = await prisma.response.findMany({
    where: { sessionId },
    select: { itemId: true, value: true, remark: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ ok: true, responses })
}
