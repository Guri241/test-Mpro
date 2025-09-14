import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const body = await req.json()

  try {
    // 複数レスポンスをまとめて保存
    await prisma.response.createMany({
      data: body.responses.map((r: any) => ({
        sessionId: id,
        itemId: r.itemId,
        value: r.value,
      })),
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
