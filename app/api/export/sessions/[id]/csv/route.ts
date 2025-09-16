// app/api/export/sessions/[id]/csv/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'

/**
 * セッションの回答を CSV でエクスポート
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } } // ← Promiseではない
) {
  const { id: sessionId } = params

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

  // ヘッダ + 1行（このセッション）
  const header = ['itemId', 'label', 'key', 'type', 'value', 'remark']
  const rows = items.map(it => {
    const r = valueMap.get(it.id)
    return [
      it.id,
      it.label?.replace(/"/g, '""') ?? '',
      it.key?.replace(/"/g, '""') ?? '',
      it.type,
      JSON.stringify(r?.value ?? null).replace(/"/g, '""'),
      (r?.remark ?? '').toString().replace(/"/g, '""'),
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
