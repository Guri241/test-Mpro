import  prisma  from '@/app/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: templateId } = await ctx.params
  const { label, key, type, unit, required, weight } = await req.json()

  const last = await prisma.templateItem.findFirst({
    where: { templateId },
    orderBy: { order: 'desc' },
  })
  const nextOrder = last ? last.order + 1 : 1

  const item = await prisma.templateItem.create({
    data: {
      templateId, label, key, type, unit,
      required: !!required,
      weight: weight ?? 1,
      order: nextOrder,
    },
  })

  return NextResponse.json(item)
}
