'use client'

import { use, useState } from 'react'
import useSWR from 'swr'

const fetcher = (u: string) => fetch(u).then(r => r.json())

export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, isLoading, mutate } = useSWR(`/api/sessions/${id}`, fetcher)

  // 入力値をまとめて管理する state
  const [values, setValues] = useState<Record<string, string | number | boolean>>({})

  if (isLoading || !data) {
    return (
      <div className="min-h-dvh grid place-items-center bg-gray-50 dark:bg-zinc-900">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading…</div>
      </div>
    )
  }

  // 入力変更ハンドラ
  const handleChange = (itemId: string, value: string | number | boolean) => {
    setValues(prev => ({ ...prev, [itemId]: value }))
  }

  // 一斉保存処理
  const handleSave = async () => {
    const res = await fetch(`/api/sessions/${id}/bulk-save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    })

    if (res.ok) {
      alert('保存しました')
      mutate() // 再取得して反映
    } else {
      alert('保存に失敗しました')
    }
  }

  return (
    <main className="min-h-dvh bg-gradient-to-b from-gray-50 to-white dark:from-zinc-900 dark:to-black">
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          {data.session.name}
        </h1>

        {/* 入力フォーム */}
        {data.items.map((item: any) => (
          <div key={item.id} className="rounded-lg border p-4 bg-white dark:bg-zinc-800">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              {item.label}
            </label>
            <input
              type={item.type === 'NUMBER' ? 'number' : item.type === 'BOOL' ? 'checkbox' : 'text'}
              value={
                item.type === 'BOOL'
                  ? undefined // チェックボックスは value ではなく checked を使う
                  : String(values[item.id] ?? '')
              }
              checked={item.type === 'BOOL' ? Boolean(values[item.id]) : undefined}
              onChange={e =>
                handleChange(
                  item.id,
                  item.type === 'BOOL'
                    ? e.target.checked
                    : e.target.value
                )
              }
              className="w-full rounded-md border px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-zinc-700"
            />

          </div>
        ))}

        {/* 保存ボタン（ページ最下部） */}
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
