import { prisma } from '@/app/lib/prisma'
import { NextResponse } from 'next/server'

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await ctx.params
  await prisma.templateItem.delete({ where: { id: itemId } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await ctx.params
  const data = await req.json()
  const updated = await prisma.templateItem.update({
    where: { id: itemId },
    data: {
      label: data.label,
      unit: data.unit,
      required: data.required,
      weight: data.weight,
    },
  })
  return NextResponse.json(updated)
}
