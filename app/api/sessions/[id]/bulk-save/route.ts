import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const { values } = await req.json()

  try {
    // まとめて保存
    for (const [itemId, value] of Object.entries(values)) {
      await prisma.response.create({
        data: {
          sessionId: id,
          itemId,
          value: typeof value === 'boolean' ? String(value) : String(value),
        },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '保存失敗' }, { status: 500 })
  }
}
