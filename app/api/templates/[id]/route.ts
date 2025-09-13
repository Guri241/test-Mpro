import { prisma } from '@/app/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const tpl = await prisma.evaluationTemplate.findUnique({
    where: { id },
    include: { items: { orderBy: { order: 'asc' } } },
  })
  if (!tpl) return new NextResponse('not found', { status: 404 })
  return NextResponse.json(tpl)
}
