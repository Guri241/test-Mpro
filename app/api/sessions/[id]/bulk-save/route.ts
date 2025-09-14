import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

type Payload = {
  items: Array<{
    itemId: string
    value: any
    remark?: string | null
  }>
}

/**
 * 一括保存
 * POST /api/sessions/:id/bulk-save
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } } // ← Promise ではなく同期オブジェクト
) {
  const sessionId = params.id

  let body: Payload
  try {
    body = (await req.json()) as Payload
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 })
  }

  if (!Array.isArray(body.items)) {
    return NextResponse.json({ ok: false, error: 'items is required' }, { status: 400 })
  }

  const now = new Date()

  // まとめて upsert（トランザクション）
  const result = await prisma.$transaction(
    body.items.map((it) =>
      prisma.response.upsert({
        where: { sessionId_itemId: { sessionId, itemId: it.itemId } },
        create: {
          sessionId,
          itemId: it.itemId,
          value: it.value,
          remark: it.remark ?? null,
          // 必要に応じて scored を計算して入れる
        },
        update: {
          value: it.value,
          remark: it.remark ?? null,
          updatedAt: now,
        },
      })
    )
  )

  return NextResponse.json({ ok: true, count: result.length })
}
