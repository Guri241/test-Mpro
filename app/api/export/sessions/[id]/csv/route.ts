// app/api/export/sessions/[id]/csv/route.ts
import { NextResponse, NextRequest } from 'next/server'
import prisma from '@/app/lib/prisma'
import { unwrapParams, type RouteCtx } from '@/app/api/_lib/params'

export async function GET(
  _req: NextRequest,
  ctx: RouteCtx<{ id: string }>
) {
  const { id: sessionId } = await unwrapParams(ctx)

  // セッション + テンプレ項目
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { id: true, name: true, templateId: true },
  })
  if (!session) {
    return NextResponse.json({ ok: false, error: 'session not found' }, { status: 404 })
  }

  const items = await prisma.templateItem.findMany({
    where: { templateId: session.templateId },
    orderBy: { order: 'asc' },
    select: { id: true, label: true, key: true, type: true, order: true },
  })

  const responses = await prisma.response.findMany({
    where: { sessionId },
    select: { itemId: true, value: true, remark: true },
  })
  const valueMap = new Map(responses.map(r => [r.itemId, r]))

  const header = ['itemId', 'label', 'key', 'type', 'value', 'remark']
  const rows = items.map(it => {
    const r = valueMap.get(it.id)
    const esc = (s: string) => (s ?? '').replace(/"/g, '""')
    return [
      it.id,
      esc(it.label ?? ''),
      esc(it.key ?? ''),
      it.type,
      JSON.stringify(r?.value ?? null).replace(/"/g, '""'),
      esc((r?.remark ?? '').toString()),
    ].map(v => `"${v}"`).join(',')
  })
  const csv = [header.join(','), ...rows].join('\n')

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="session-${sessionId}.csv"`,
    },
  })
}
