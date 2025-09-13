// app/api/sessions/[id]/response/route.ts
import { prisma } from '@/app/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await ctx.params
  const { itemId, value, remark } = await req.json()

  if (!itemId) return NextResponse.json({ error: 'itemId is required' }, { status: 400 })

  const item = await prisma.templateItem.findUnique({ where: { id: itemId } })
  if (!item) return NextResponse.json({ error: 'item not found' }, { status: 404 })

  // スコア算出（必要なら）
  let scored: number | null = null
  if (item.type === 'NUMBER') {
    const v = Number((value as any)?.value ?? value)
    scored = Number.isFinite(v) ? v : null
  } else if (item.type === 'BOOL') {
    const v = Boolean((value as any)?.value ?? value)
    scored = v ? 1 : 0
  }

  // ★毎回新規レコードを追加
  const created = await prisma.response.create({
    data: { sessionId, itemId, value, remark, scored }
  })

  return NextResponse.json(created, { status: 201 })
}
