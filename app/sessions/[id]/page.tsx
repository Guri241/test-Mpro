'use client'

import { use, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

type Item = {
  id: string
  label: string
  key: string
  type: 'NUMBER' | 'TEXT' | 'BOOL'
  unit?: string | null
  required: boolean
  order: number
}

type ApiResponse = {
  session: { id: string; name: string; product?: { name?: string }; templateId?: string }
  items: Item[]
  responses: Array<{
    itemId: string
    value: any
    remark?: string | null
  }>
}

const fetcher = (u: string) => fetch(u).then(r => r.json())

function toFlatValue(v: any): string | number | boolean | '' {
  // レスポンスのvalueは { value: X } の形でも来るので平坦化
  if (v && typeof v === 'object' && 'value' in v) v = (v as any).value
  if (typeof v === 'number') return v
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') return v
  return ''
}

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Next.js 15 の params は Promise なので use() で展開
  const { id } = use(params)

  const { data, mutate, isLoading } = useSWR<ApiResponse>(
    `/api/sessions/${id}`,
    fetcher
  )

  // 画面ローカルの編集用状態（全項目）
  // form[itemId] = { value, remark }
  const [form, setForm] = useState<Record<string, { value: any; remark?: string }>>({})
  const [saving, setSaving] = useState(false)

  // 初期値を API から流し込む
  useEffect(() => {
    if (!data) return
    const next: Record<string, { value: any; remark?: string }> = {}
    for (const it of data.items) {
      const r = data.responses.find(x => x.itemId === it.id)
      const base = toFlatValue(r?.value)
      next[it.id] = { value: base ?? (it.type === 'BOOL' ? false : '') }
    }
    setForm(next)
  }, [data])

  const header = useMemo(() => {
    if (!data) return null
    return (
      <header className="mb-4">
        <h1 className="text-2xl font-bold">{data.session.name ?? 'セッション'}</h1>
        <p className="text-sm text-gray-500">
          対象: {data.session.product?.name ?? '-'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <a
            className="inline-flex items-center gap-1 rounded-full border px-3 py-1 hover:bg-gray-50"
            href={`/sessions/${id}/dashboard`}
          >
            📈 グラフ
          </a>
          <a
            className="inline-flex items-center gap-1 rounded-full border px-3 py-1 hover:bg-gray-50"
            href={`/api/export/sessions/${id}/csv`}
          >
            ⬇️ CSV
          </a>
          {data.session.templateId && (
            <a
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1 hover:bg-gray-50"
              href={`/templates/${data.session.templateId}/edit`}
            >
              ✚ 項目追加・編集
            </a>
          )}
        </div>
      </header>
    )
  }, [data, id])

  // 入力変更ハンドラ（型ごとに整える）
  function setValue(item: Item, raw: any) {
    setForm(prev => {
      const current = { ...(prev[item.id] || {}) }

      if (item.type === 'NUMBER') {
        const n = raw === '' ? '' : Number(raw)
        current.value = Number.isFinite(n) ? n : ''
      } else if (item.type === 'BOOL') {
        current.value = raw === 'true' || raw === true
      } else {
        // TEXT
        current.value = String(raw ?? '')
      }

      return { ...prev, [item.id]: current }
    })
  }

  // 保存（まとめて保存）
  async function handleSave() {
    if (!data) return
    setSaving(true)
    try {
      // payload を item の順に構築
      const responses = data.items.map(it => {
        const v = form[it.id]?.value
        // API 側では { value: ... } でもそのままでも upsert 可能だが、
        // ここでは { value: ... } で統一
        return {
          itemId: it.id,
          value:
            it.type === 'NUMBER'
              ? (typeof v === 'number' ? v : Number(v || 0))
              : it.type === 'BOOL'
              ? Boolean(v)
              : String(v ?? ''),
        }
      })

      const res = await fetch(`/api/sessions/${id}/bulk-save`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ responses }),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || '保存に失敗しました')
      }

      // 再取得
      await mutate()
      // 軽いフィードバック
      alert('保存しました')
    } catch (e: any) {
      console.error(e)
      alert(e?.message ?? '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || !data) {
    return <div className="p-6 text-gray-500">Loading...</div>
  }

  return (
    <main className="p-6 space-y-6">
      {header}

      {/* 入力リスト */}
      <section className="space-y-4">
        {data.items.map(it => (
          <div key={it.id} className="border rounded-xl p-4">
            <div className="font-semibold">
              {it.label}{' '}
              <span className="text-xs text-gray-500">{it.unit ?? ''}</span>
            </div>

            {/* フィールド */}
            {it.type === 'NUMBER' && (
              <input
                type="number"
                step="any"
                className="mt-2 border rounded px-2 py-1 w-56"
                value={form[it.id]?.value ?? ''}
                onChange={e => setValue(it, e.currentTarget.value)}
              />
            )}

            {it.type === 'TEXT' && (
              <input
                type="text"
                className="mt-2 border rounded px-2 py-1 w-full max-w-xl"
                value={form[it.id]?.value ?? ''}
                onChange={e => setValue(it, e.currentTarget.value)}
              />
            )}

            {it.type === 'BOOL' && (
              <select
                className="mt-2 border rounded px-2 py-1 w-40"
                value={(form[it.id]?.value ?? false) ? 'true' : 'false'}
                onChange={e => setValue(it, e.currentTarget.value)}
              >
                <option value="true">合格</option>
                <option value="false">不合格</option>
              </select>
            )}
          </div>
        ))}
      </section>

      {/* 一番下に保存ボタン（要求どおり） */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-black text-white px-5 py-2.5 hover:opacity-90 disabled:opacity-50"
        >
          {saving ? '保存中…' : 'すべて保存する'}
        </button>
      </div>
    </main>
  )
}
