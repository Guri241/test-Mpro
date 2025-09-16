import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { Prisma } from '@prisma/client'
import { unwrapParams, type RouteCtx } from '@/app/api/_lib/params'

type Row = { itemId: string; value: unknown; note?: string | null }
type Payload = { rows: Row[] }

const jsonSafe = (v: unknown) => JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue

export async function POST(
  request: NextRequest,
  ctx: RouteCtx<{ id: string }>
) {
  const { id: sessionId } = await unwrapParams(ctx)

  try {
    const body = (await request.json()) as Payload

    // 後方互換: { values: Record<string, unknown> } 形式にも対応
    if (!Array.isArray((body as any)?.rows) && body && typeof (body as any).values === 'object') {
      const values = (body as any).values as Record<string, unknown>
      ;(body as any).rows = Object.entries(values).map(([itemId, value]) => ({ itemId, value }))
    }

    if (!Array.isArray(body?.rows)) {
      return NextResponse.json({ ok: false, error: 'rows must be an array' }, { status: 400 })
    }

    // itemId 重複は最後の値を採用
    const dedup = new Map<string, Row>()
    for (const r of body.rows) if (r?.itemId) dedup.set(r.itemId, r)
    const rows = Array.from(dedup.values())
    if (rows.length === 0) return NextResponse.json({ ok: true, count: 0 })

    // 1) 最新スナップショットは upsert（Response は常に1件）
    const upserts = rows.map((r) =>
      prisma.response.upsert({
        where: { sessionId_itemId: { sessionId, itemId: r.itemId } },
        update: { value: jsonSafe(r.value), remark: r.note ?? null },
        create: { sessionId, itemId: r.itemId, value: jsonSafe(r.value), remark: r.note ?? null },
      })
    )

    // 2) 履歴に append
    const samples = prisma.responseSample.createMany({
      data: rows.map((r) => ({
        sessionId,
        itemId: r.itemId,
        value: jsonSafe(r.value),
        remark: r.note ?? null,
      })),
    })

    await prisma.$transaction([...upserts, samples])
    return NextResponse.json({ ok: true, count: rows.length })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { ok: false, code: err.code, message: err.message, meta: err.meta },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { ok: false, message: (err as Error).message ?? 'unexpected error' },
      { status: 400 }
    )
  }
}
