'use client'
import { use } from 'react'
import useSWR from 'swr'
import { useState } from 'react'

const fetcher = (u: string) => fetch(u).then(r => r.json())

export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, mutate, isLoading } = useSWR(`/api/sessions/${id}`, fetcher)
  const [saving, setSaving] = useState(false)

  async function save(itemId: string, value: any) {
    setSaving(true)
    try {
      await fetch(`/api/sessions/${id}/response`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ itemId, value }),
      })
      await mutate()
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-dvh grid place-items-center bg-gradient-to-b from-gray-50 to-white dark:from-zinc-900 dark:to-black">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading…</div>
      </div>
    )
  }

  return (
    <main className="min-h-dvh bg-gradient-to-b from-gray-50 to-white dark:from-zinc-900 dark:to-black">
      {/* アクションバー（上部固定） */}
<div className="sticky top-0 z-40 w-full border-b border-gray-200
                bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
  <div className="mx-auto max-w-5xl px-4 py-2
                  flex items-center gap-3 overflow-x-auto">
    {/* 項目追加 */}
    {data?.session?.templateId && (
      <a href={`/templates/${data.session.templateId}/edit?session=${id}`}className="btn">
          ＋ 項目追加
      </a>

    )}

    {/* グラフ */}
    <a href={`/sessions/${id}/dashboard`} className="btn">
      📈 グラフ
    </a>

    {/* CSV */}
    <a href={`/api/export/sessions/${id}/csv`} className="btn">
      ⬇️ CSV
    </a>
  </div>
</div>

      {/* Top Bar */}
      <div className="sticky top-0 z-40 border-b border-gray-200/60 dark:border-white/10 backdrop-blur bg-white/70 dark:bg-zinc-900/70">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              {data.session.name ?? 'セッション'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              対象：{data.session.product?.name ?? '-'}
            </p>
          </div>
          <a
            href={`/sessions/${id}/dashboard`}
            className="hidden sm:inline-flex items-center gap-2 rounded-full border border-gray-300/70 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-700"
          >
            <span>📈</span> グラフ
          </a>
        </div>

        {/* Saving banner (global) */}
        {saving && (
          <div className="mx-auto max-w-4xl px-4 pb-3">
            <div className="rounded-lg bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-300 px-3 py-2 text-sm shadow-sm border border-amber-200/60 dark:border-amber-300/20">
              保存中…
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
        {data.items.map((it: any) => {
          const current = (data.responses as any[]).find((r: any) => r.itemId === it.id)?.value
          const val = typeof current === 'object' && current ? (current as any).value : current

          return (
            <div
              key={it.id}
              className="group rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-zinc-900/70 backdrop-blur px-4 py-4 shadow-sm hover:shadow transition-shadow"
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                  {it.label}{' '}
                  {it.unit ? (
                    <span className="text-xs text-gray-500 dark:text-gray-400">（{it.unit}）</span>
                  ) : null}
                </div>
                {it.required && (
                  <span className="text-[10px] rounded-full bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300 px-2 py-0.5 border border-rose-200/60 dark:border-rose-300/20">
                    必須
                  </span>
                )}
              </div>

              <div className="mt-2">
                {it.type === 'NUMBER' && (
                  <input
                    type="number"
                    className="w-full rounded-xl border border-gray-300/70 dark:border-white/10 bg-white dark:bg-zinc-800 px-3 py-2 text-sm outline-none ring-0 focus:border-indigo-400 dark:focus:border-indigo-400"
                    defaultValue={val ?? ''}
                    onBlur={(e) => save(it.id, { value: Number(e.currentTarget.value) })}
                  />
                )}

                {it.type === 'TEXT' && (
                  <input
                    type="text"
                    className="w-full rounded-xl border border-gray-300/70 dark:border-white/10 bg-white dark:bg-zinc-800 px-3 py-2 text-sm outline-none ring-0 focus:border-indigo-400 dark:focus:border-indigo-400"
                    defaultValue={val ?? ''}
                    onBlur={(e) => save(it.id, { value: e.currentTarget.value })}
                  />
                )}

                {it.type === 'BOOL' && (
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-xl border border-gray-300/70 dark:border-white/10 bg-white dark:bg-zinc-800 px-3 py-2 text-sm outline-none ring-0 focus:border-indigo-400 dark:focus:border-indigo-400"
                      defaultValue={(val ?? false) ? 'true' : 'false'}
                      onChange={(e) => save(it.id, { value: e.target.value === 'true' })}
                    >
                      <option value="true">合格</option>
                      <option value="false">不合格</option>
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
