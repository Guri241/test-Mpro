// app/api/templates/[id]/items/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { unwrapParams, type RouteCtx } from '@/app/api/_lib/params'

/**
 * テンプレに項目を追加
 * body: { label: string; key: string; type: 'TEXT'|'NUMBER'|'BOOL'; unit?: string|null; required?: boolean; weight?: number; options?: any }
 */
export async function POST(
  request: NextRequest,
  ctx: RouteCtx<{ id: string }>
) {
  const { id: templateId } = await unwrapParams(ctx)
  const body = await request.json() as {
    label: string; key: string; type: 'TEXT'|'NUMBER'|'BOOL';
    unit?: string|null; required?: boolean; weight?: number; options?: any
  }

  if (!body?.label || !body?.key || !body?.type) {
    return NextResponse.json({ ok: false, error: 'label, key, type are required' }, { status: 400 })
  }

  // 次の order を決める
  const max = await prisma.templateItem.aggregate({
    where: { templateId },
    _max: { order: true },
  })
  const nextOrder = (max._max.order ?? 0) + 1

  const created = await prisma.templateItem.create({
    data: {
      templateId,
      label: body.label,
      key: body.key,
      type: body.type,
      unit: body.unit ?? null,
      required: !!body.required,
      order: nextOrder,
      options: body.options ?? null,
      weight: body.weight ?? 1,
    },
    select: {
      id: true, label: true, key: true, type: true, required: true, unit: true, order: true, options: true,
    },
  })

  return NextResponse.json({ ok: true, item: created })
}
