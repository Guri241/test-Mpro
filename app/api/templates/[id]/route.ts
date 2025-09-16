// app/api/templates/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'

export async function GET(
  _req: NextRequest,
  ctx: { params: { id: string } }
) {
  const { id } = ctx.params

  const template = await prisma.evaluationTemplate.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      status: true,
      meta: true,
      createdAt: true,
      items: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          label: true,
          key: true,
          type: true,
          required: true,
          unit: true,
          order: true,
          options: true,
        },
      },
    },
  })

  if (!template) {
    return NextResponse.json({ ok: false, error: 'template not found' }, { status: 404 })
  }

  return NextResponse.json(template)
}
