// app/api/sessions/[id]/bulk-save/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

/**
 * 期待するリクエストボディ例:
 * {
 *   "rows": [
 *     { "itemId": "xxxxx", "value": 123, "note": "任意" },
 *     { "itemId": "yyyyy", "value": true }
 *   ]
 * }
 */
type Row = {
  itemId: string
  value: unknown
  note?: string | null
}
type Payload = { rows: Row[] }

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } } // ← これが重要（Promise ではなく { id: string }）
) {
  try {
    const sessionId = params.id
    if (!sessionId) {
      return NextResponse.json({ ok: false, message: 'session id required' }, { status: 400 })
    }

    const body = (await request.json()) as Payload
    if (!body || !Array.isArray(body.rows)) {
      return NextResponse.json({ ok: false, message: 'invalid payload' }, { status: 400 })
    }

    // セッション存在チェック（任意）
    const s = await prisma.session.findUnique({ where: { id: sessionId }, select: { id: true } })
    if (!s) {
      return NextResponse.json({ ok: false, message: 'session not found' }, { status: 404 })
    }

    // まとめて upsert
    // Response テーブルのユニークキーが (sessionId, itemId) の想定
    await prisma.$transaction(
      body.rows.map((r) =>
        prisma.response.upsert({
          where: { sessionId_itemId: { sessionId, itemId: r.itemId } },
          update: { value: r.value as any, note: r.note ?? null },
          create: { sessionId, itemId: r.itemId, value: r.value as any, note: r.note ?? null },
        }),
      ),
    )

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ ok: false, message: 'server error' }, { status: 500 })
  }
}
