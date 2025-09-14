import { prisma } from '@/app/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { id: sessionId } = params
  const { responses } = await req.json() // [{ itemId, value, remark }, ...]

  for (const r of responses) {
    await prisma.response.upsert({
      where: { sessionId_itemId: { sessionId, itemId: r.itemId } },
      create: { sessionId, itemId: r.itemId, value: r.value, remark: r.remark },
      update: { value: r.value, remark: r.remark, updatedAt: new Date() },
    })
  }

  return NextResponse.json({ ok: true })
}
