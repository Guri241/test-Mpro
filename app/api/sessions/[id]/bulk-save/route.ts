// app/api/sessions/[id]/bulk-save/route.ts
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

    // 後方互換: { values: Record<string, unknown> } にも対応
    if (!Array.isArray((body as any)?.rows) && body && typeof (body as any).values === 'object') {
      const values = (body as any).values as Record<string, unknown>
      ;(body as any).rows = Object.entries(values).map(([itemId, value]) => ({ itemId, value }))
    }

    if (!Array.isArray(body?.rows)) {
      return NextResponse.json({ ok: false, error: 'rows must be an array' }, { status: 400 })
    }

    const seen = new Set<string>()
    const tx = []
    for (const r of body.rows) {
      if (!r?.itemId || seen.has(r.itemId)) continue
      seen.add(r.itemId)
      tx.push(
        prisma.response.upsert({
          where: { sessionId_itemId: { sessionId, itemId: r.itemId } },
          update: { value: jsonSafe(r.value), remark: r.note ?? null },
          create: { sessionId, itemId: r.itemId, value: jsonSafe(r.value), remark: r.note ?? null },
        })
      )
    }

    const results = await prisma.$transaction(tx)
    return NextResponse.json({ ok: true, count: results.length })
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
