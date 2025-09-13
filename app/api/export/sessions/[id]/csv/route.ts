import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params

  const s = await prisma.session.findUnique({
    where: { id },
    include: {
      responses: { include: { item: true }, orderBy: { createdAt: 'asc' } },
      product: true,
      template: true,
    },
  })
  if (!s) return new NextResponse('not found', { status: 404 })

  // ヘッダ
  const rows: string[][] = [['項目', '値', '単位', 'スコア', '備考']]

  // 本文
  for (const r of s.responses) {
    const v: any = r.value
    const valueStr =
      v == null
        ? ''
        : typeof v === 'object' && 'value' in v
        ? String(v.value)
        : String(v)

    rows.push([
      r.item.label ?? '',
      valueStr,
      r.item.unit ?? '',
      r.scored != null ? String(r.scored) : '',
      r.remark ?? '',
    ])
  }

  // CSVエスケープ（ダブルクオート2重化）
  const esc = (x: string) => `"${x.replaceAll('"', '""')}"`
  const csvBody = rows.map(cols => cols.map(esc).join(',')).join('\r\n')

  // ★UTF-8 BOM を先頭に付与
  const BOM = '\uFEFF'
  const csv = BOM + csvBody

  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      // ファイル名（日本語もOK）
      'content-disposition': `attachment; filename="session-${id}.csv"`,
      'cache-control': 'no-store',
    },
  })
}
