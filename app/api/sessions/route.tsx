import { prisma } from '@/app/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const rows = await prisma.session.findMany({
    select: { id: true, name: true, templateId: true, productId: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(rows)
}
