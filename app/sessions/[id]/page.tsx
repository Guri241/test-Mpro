'use client'

import { use, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const fetcher = (u: string) => fetch(u).then(r => r.json())

type Item = {
  id: string
  label: string
  type: 'TEXT' | 'NUMBER' | 'BOOL'
  required?: boolean
  unit?: string | null
  options?: any
}

type SessionApiResponse = {
  session?: { id: string; name: string; templateId: string }
  items: Item[]
  responses?: Array<{ itemId: string; value: any; remark?: string | null }>
  ok?: boolean
  error?: string
}

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Next.js 15 client: params は Promise を use() で unwrap
  const { id } = use(params)

  // ?session=xxx が付いていればそれを優先表示（任意）
  const search = useSearchParams()
  const sessionFromQuery = search.get('session') ?? undefined

  // データ取得
  const { data, isLoading, mutate } = useSWR<SessionApiResponse>(
    `/api/sessions/${id}`,
    fetcher
  )

  // --- Hooks はここで確定（この順番を変えない） -----------------------------

  // 入力値 state（常に空で宣言し、到着時に useEffect で同期）
  const [values, setValues] = useState<
    Record<string, string | number | boolean>
  >({})

  // data.responses 到着時に一度だけ同期（編集開始後は上書きしない）
  useEffect(() => {
    if (data?.responses && data.responses.length > 0) {
      const next: Record<string, string | number | boolean> = {}
      for (const r of data.responses) {
        next[r.itemId] = r.value as any
      }
      setValues(next)
    }
  }, [data?.responses])

  // ここまでで Hooks の並びは固定。以降の early return は OK
  // ------------------------------------------------------------------------

  // ローディング / 404 風ガード
  if (isLoading || !data) {
    return (
      <div className="min-h-dvh grid place-items-center bg-gray-50 dark:bg-zinc-900">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">
          Loading…
        </div>
      </div>
    )
  }
  if (!data.session) {
    return (
      <main className="min-h-dvh grid place-items-center p-8 text-center">
        <div>
          <div className="text-xl font-semibold mb-2">セッションがありません</div>
          <p className="text-sm text-gray-500">
            seed を流すか、一覧から作成してください。
          </p>
        </div>
      </main>
    )
  }

  // ✅ 参照に使う ID
  const sessionId = sessionFromQuery ?? data.session.id
  const templateId = data.session.templateId

  const handleChange = (itemId: string, next: string | number | boolean) => {
    setValues(prev => ({ ...prev, [itemId]: next }))
  }

  // 型整形（NUMBER→数値/nullable、BOOL→boolean、TEXT→string）
  const coerceValueByType = (type: Item['type'], raw: any) => {
    if (type === 'NUMBER') {
      if (raw === '' || raw === null || raw === undefined) return null
      const n = typeof raw === 'number' ? raw : Number(raw)
      return Number.isFinite(n) ? n : null
    }
    if (type === 'BOOL') return Boolean(raw)
    return raw == null ? '' : String(raw)
  }

  const handleSave = async () => {
    try {
      const rows = data.items.map(item => {
        const raw = values[item.id]
        const value = coerceValueByType(item.type, raw)
        return { itemId: item.id, value }
      })

      const res = await fetch(`/api/sessions/${id}/bulk-save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })

      const payload = await res.json().catch(() => ({}))

      if (!res.ok) {
        console.error('bulk-save failed:', payload)
        alert(`保存失敗:\n${JSON.stringify(payload, null, 2)}`)
        return
      }

      alert('保存しました')
      mutate()
    } catch (e: any) {
      console.error(e)
      alert(`保存失敗（例外）:\n${e?.message ?? String(e)}`)
    }
  }

  return (
    <main className="min-h-dvh bg-gradient-to-b from-gray-50 to-white dark:from-zinc-900 dark:to-black">
      {/* ✅ アクションバー（固定） */}
      <div className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-zinc-700 dark:bg-zinc-900/80">
        <div className="mx-auto max-w-3xl px-4 py-2 flex items-center gap-3 overflow-x-auto">
          <>
            <Link
              prefetch={false}
              href={`/templates/${templateId}/edit?session=${sessionId}`}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800"
            >
              ← 項目追加
            </Link>
            <Link
              prefetch={false}
              href={`/sessions/${sessionId}/dashboard`}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800"
            >
              📈 グラフ
            </Link>
            <Link
              prefetch={false}
              href={`/api/export/sessions/${sessionId}/csv`}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800"
            >
              ⬇️ CSV
            </Link>
          </>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => mutate()}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800"
              title="再読込"
            >
              再読込
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow hover:bg-blue-700"
              title="保存"
            >
              保存
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          {data.session.name}
        </h1>

        {data.items.map(item => {
          const v = values[item.id]
          const isBool = item.type === 'BOOL'
          const isNum = item.type === 'NUMBER'

          return (
            <div
              key={item.id}
              className="rounded-lg border p-4 bg-white dark:bg-zinc-800"
            >
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {item.label}
                {item.unit ? (
                  <span className="ml-1 text-xs text-gray-500">（{item.unit}）</span>
                ) : null}
              </label>

              {isBool ? (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={Boolean(v)}
                    onChange={e => handleChange(item.id, e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    ON/OFF
                  </span>
                </div>
              ) : (
                <input
                  type={isNum ? 'number' : 'text'}
                  value={v == null ? '' : String(v)}
                  onChange={e =>
                    handleChange(
                      item.id,
                      isNum ? (e.target.value === '' ? '' : e.target.value) : e.target.value
                    )
                  }
                  className="w-full rounded-md border px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-zinc-700"
                />
              )}
            </div>
          )
        })}

        {/* フッター保存 */}
        <div className="pt-6">
          <button
            onClick={handleSave}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-white font-semibold shadow hover:bg-blue-700"
          >
            全て保存する
          </button>
        </div>
      </div>
    </main>
  )
}
