// app/api/sessions/[id]/bulk-save/route.ts
import prisma from '@/app/lib/prisma'
import { Prisma } from '@prisma/client'

type Row = {
  itemId: string
  value: unknown
  note?: string | null
}

type Payload = {
  rows: Row[]
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  　const { id: sessionId } = await context.params

  try {
    const body = (await request.json()) as Payload

    if (!Array.isArray(body?.rows)) {
      return new Response(
        JSON.stringify({ ok: false, error: 'rows must be an array' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      )
    }
    if (body.rows.length === 0) {
      return new Response(JSON.stringify({ ok: true, count: 0 }), {
        headers: { 'content-type': 'application/json' },
      })
    }

    const latestByItemId = new Map<string, Row>()
    for (const r of body.rows) latestByItemId.set(r.itemId, r)
    const rows = [...latestByItemId.values()]

    const tx = rows.map((r) =>
      prisma.response.upsert({
        where: {
          // ★ schema に name を付けている場合はこちらを使う
          Response_sessionId_itemId_key: {
            sessionId,
            itemId: r.itemId,
          },
          // name を外している場合は下のコメントを使う
          // sessionId_itemId: { sessionId, itemId: r.itemId },
        },
        update: {
          value: r.value as Prisma.InputJsonValue,
          remark: r.note ?? null,
        },
        create: {
          sessionId,
          itemId: r.itemId,
          value: r.value as Prisma.InputJsonValue,
          remark: r.note ?? null,
        },
      })
    )

    const results = await prisma.$transaction(tx)
    return new Response(JSON.stringify({ ok: true, count: results.length }), {
      headers: { 'content-type': 'application/json' },
    })
  } catch (err) {
    if (err instanceof SyntaxError) {
      return new Response(
        JSON.stringify({ ok: false, error: 'invalid JSON payload' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      )
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return new Response(
        JSON.stringify({ ok: false, error: err.message, code: err.code }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      )
    }
    return new Response(
      JSON.stringify({ ok: false, error: (err as Error).message ?? 'unexpected error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }
}
