// app/api/sessions/[id]/bulk-save/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { Prisma } from '@prisma/client'

type Row = { itemId: string; value: unknown; note?: string | null }
type Payload = { rows: Row[] }

function dedupeRows<T extends { itemId: string }>(rows: T[]): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const r of rows) {
    if (typeof r.itemId !== 'string' || r.itemId.trim() === '') continue
    if (!seen.has(r.itemId)) {
      seen.add(r.itemId)
      out.push(r)
    }
  }
  return out
}

function toJsonSafe(value: unknown) {
  return JSON.parse(JSON.stringify(value))
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }   // ← Promise ではない
) {
  const { id: sessionId } = params

  try {
    const body = (await request.json()) as Payload

    // { values: {...} } で来た互換入力も rows に変換（任意）
    if (!Array.isArray((body as any)?.rows) && body && typeof (body as any).values === 'object') {
      const values = (body as any).values as Record<string, unknown>
      ;(body as any).rows = Object.entries(values).map(([itemId, value]) => ({ itemId, value }))
    }

    if (!Array.isArray(body?.rows)) {
      return NextResponse.json({ ok: false, error: 'rows must be an array' }, { status: 400 })
    }

    const rows = dedupeRows(body.rows).map((r) => ({
      itemId: r.itemId,
      value: toJsonSafe(r.value) as Prisma.InputJsonValue,
      remark: r.note ?? null,
    }))

    if (rows.length === 0) {
      return NextResponse.json({ ok: true, count: 0 })
    }

    const tx = rows.map((r) =>
      prisma.response.upsert({
        where: { sessionId_itemId: { sessionId, itemId: r.itemId } },
        update: { value: r.value, remark: r.remark },
        create: { sessionId, itemId: r.itemId, value: r.value, remark: r.remark },
      })
    )

    const results = await prisma.$transaction(tx)
    return NextResponse.json({ ok: true, count: results.length })
  } catch (err) {
    console.error('[bulk-save error]', err)
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
