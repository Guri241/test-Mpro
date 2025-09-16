// app/api/sessions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { unwrapParams, type RouteCtx } from '@/app/api/_lib/params'

/**
 * セッションの概要 + テンプレ項目 + 既存回答を返す
 */
export async function GET(
  _req: NextRequest,
  ctx: RouteCtx<{ id: string }>
) {
  const { id } = await unwrapParams(ctx)

  const session = await prisma.session.findUnique({
    where: { id },
    select: { id: true, name: true, templateId: true },
  })
  if (!session) {
    return NextResponse.json({ ok: false, error: 'session not found' }, { status: 404 })
  }

  const items = await prisma.templateItem.findMany({
    where: { templateId: session.templateId },
    orderBy: { order: 'asc' },
    select: {
      id: true, label: true, type: true, required: true, unit: true, options: true, order: true,
    },
  })

  const responses = await prisma.response.findMany({
    where: { sessionId: session.id },
    select: { itemId: true, value: true, remark: true },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ session, items, responses })
}
