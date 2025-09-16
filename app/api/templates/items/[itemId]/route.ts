// app/api/templates/items/[itemId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'

/**
 * テンプレ項目を削除
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { itemId: string } } // ← Promiseではない
) {
  const { itemId } = params
  try {
    await prisma.templateItem.delete({ where: { id: itemId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message ?? 'unexpected error' },
      { status: 400 }
    )
  }
}

/**
 * テンプレ項目の部分更新（任意）
 * body: { label?, key?, type?, unit?, required?, order?, options? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  const { itemId } = params
  const data = await request.json()
  try {
    const updated = await prisma.templateItem.update({
      where: { id: itemId },
      data,
      select: {
        id: true, label: true, key: true, type: true, required: true, unit: true, order: true, options: true,
      },
    })
    return NextResponse.json({ ok: true, item: updated })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message ?? 'unexpected error' },
      { status: 400 }
    )
  }
}
