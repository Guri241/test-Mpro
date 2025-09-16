// app/api/templates/[id]/reorder/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { unwrapParams, type RouteCtx } from '@/app/api/_lib/params'

/**
 * テンプレ内の項目順を並び替え
 * body: { itemIds: string[] } // 先頭から順に order=1,2,3...
 */
export async function PATCH(
  request: NextRequest,
  ctx: RouteCtx<{ id: string }>
) {
  const { id: templateId } = await unwrapParams(ctx)
  const body = await request.json() as { itemIds: string[] }

  if (!Array.isArray(body?.itemIds) || body.itemIds.length === 0) {
    return NextResponse.json({ ok: false, error: 'itemIds must be a non-empty array' }, { status: 400 })
  }

  await prisma.$transaction(
    body.itemIds.map((itemId, i) =>
      prisma.templateItem.update({
        where: { id: itemId },
        data: { order: i + 1, templateId },
      })
    )
  )
  return NextResponse.json({ ok: true })
}
