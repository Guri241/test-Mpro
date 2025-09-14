// app/api/sessions/[id]/bulk-save/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'   // default import (どちらでもOK)
import type { NextRequest } from 'next/server'

type Payload = {
  itemId: string
  value: string | number | boolean | null
}

export async function POST(req: NextRequest, context: { params: { id: string } }) {
  try {
    const sessionId = context.params.id
    const body = (await req.json()) as Payload[]

    // 既存レスポンス削除してから一括保存
    await prisma.response.deleteMany({
      where: { sessionId }
    })

    await prisma.response.createMany({
      data: body.map((row) => ({
        sessionId,
        itemId: row.itemId,
        value: row.value,
      }))
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
