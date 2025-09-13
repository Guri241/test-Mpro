import { prisma } from '@/app/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: templateId } = await ctx.params
  const { itemIds }:{ itemIds: string[] } = await req.json()
  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    return NextResponse.json({ error: 'itemIds required' }, { status: 400 })
  }
  await prisma.$transaction(
    itemIds.map((id, idx) =>
      prisma.templateItem.update({
        where: { id },
        data: { order: (idx + 1) * 10 },
      })
    )
  )
  return NextResponse.json({ ok: true })
}
