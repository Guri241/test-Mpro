// app/api/sessions/[id]/route.ts
import { prisma } from '@/app/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params

  const s = await prisma.session.findUnique({
    where: { id },
    include: {
      template: { include: { items: { orderBy: { order: 'asc' } } } },
      responses: {
        include: { item: { select: { id: true, label: true } } }, // ラベルを前段で使う
        orderBy: { createdAt: 'asc' },                            // ★ここを追加
        // createdAt が無ければ: orderBy: { id: 'asc' } でも可
      },
      product: true,
    },
  })

  if (!s) return new NextResponse('not found', { status: 404 })

  return NextResponse.json({
    session: { id: s.id, name: s.name, product: s.product, templateId: s.templateId },
    items: s.template.items,
    responses: s.responses, // ← createdAt の昇順で返る
  })
}
