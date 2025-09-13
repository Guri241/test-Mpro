'use client'
import { use } from 'react'
import useSWR from 'swr'
import { useSearchParams } from 'next/navigation'

type Item = {
  id: string; label: string; key: string;
  type: 'NUMBER'|'TEXT'|'BOOL'; unit?: string|null;
  required: boolean; order: number
}

const fetcher = (u:string)=>fetch(u).then(r=>r.json())

export default function TemplateEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const search = useSearchParams()
  const sessionId = search.get('session') // ← セッションID（あれば）

  const { data, mutate, isLoading } = useSWR(`/api/templates/${id}`, fetcher)

  async function addItem(form: FormData) {
    const payload = {
      label: String(form.get('label') ?? ''),
      key: String(form.get('key') ?? ''),
      type: String(form.get('type') ?? 'TEXT'),
      unit: String(form.get('unit') ?? '') || null,
      required: form.get('required') === 'on',
      weight: 1,
    }
    const optimistic = { ...data, items: [...data.items, { ...payload, id: `tmp-${Date.now()}`, order: data.items.length + 1 }] }
    await mutate(async () => {
      await fetch(`/api/templates/${id}/items`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload)
      })
      return await fetcher(`/api/templates/${id}`)
    }, { optimisticData: optimistic, rollbackOnError: true, revalidate: false })
    ;(document.getElementById('add-form') as HTMLFormElement)?.reset()
  }

  async function removeItem(itemId: string) {
    const optimistic = { ...data, items: data.items.filter((it: Item) => it.id !== itemId) }
    await mutate(async () => {
      await fetch(`/api/templates/items/${itemId}`, { method: 'DELETE' })
      return await fetcher(`/api/templates/${id}`)
    }, { optimisticData: optimistic, rollbackOnError: true, revalidate: false })
  }

  // 並び替え（上へ/下へ）
  function swap(a: number, b: number) {
    const arr = [...data.items]
    ;[arr[a], arr[b]] = [arr[b], arr[a]]
    return arr
  }
  async function saveOrder(items: Item[]) {
    await mutate(async () => {
      await fetch(`/api/templates/${id}/reorder`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ itemIds: items.map(i => i.id) })
      })
      return await fetcher(`/api/templates/${id}`)
    }, { optimisticData: { ...data, items }, rollbackOnError: true, revalidate: false })
  }

  if (isLoading || !data) return <div className="p-6">Loading...</div>

  return (
    <main className="p-6 space-y-6">
      {/* ✅ 上部アクションバー（横一列） */}
      <div className="sticky top-0 z-40 w-full border-b border-gray-200
                      bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-5xl px-4 py-2 flex items-center gap-3 overflow-x-auto">
          {sessionId && (
            <>
              <a href={`/sessions/${sessionId}`} className="btn">← 入力へ</a>
              <a href={`/sessions/${sessionId}/dashboard`} className="btn">📈 グラフ</a>
              <a href={`/api/export/sessions/${sessionId}/csv`} className="btn">⬇️ CSV</a>
            </>
          )}
        </div>
      </div>

      <header className="mb-2 flex items-center justify-between">
        <h1 className="text-xl font-bold">テンプレ編集：{data.name ?? id}</h1>
      </header>

      {/* 追加フォーム */}
      <form
        id="add-form"
        className="flex flex-wrap gap-2 items-end"
        onSubmit={(e) => { e.preventDefault(); addItem(new FormData(e.currentTarget)) }}
      >
        <input name="label" placeholder="表示名" className="border rounded px-3 py-2" required />
        <input name="key" placeholder="キー" className="border rounded px-3 py-2" required />
        <select name="type" className="border rounded px-3 py-2">
          <option value="NUMBER">NUMBER</option>
          <option value="TEXT">TEXT</option>
          <option value="BOOL">BOOL</option>
        </select>
        <input name="unit" placeholder="単位(任意)" className="border rounded px-3 py-2" />
        <label className="text-sm flex items-center gap-1">
          <input type="checkbox" name="required" /> 必須
        </label>
        <button className="btn">追加</button>
      </form>

      {/* リスト */}
      <div className="space-y-2">
        {data.items.map((it: Item, idx: number) => (
          <div key={it.id} className="border rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="font-semibold">
                {it.label} <span className="text-xs text-gray-500">
                  ({it.type}{it.unit ? `/${it.unit}` : ''})
                </span>
              </div>
              <div className="text-xs text-gray-500">key: {it.key} / order: {it.order}</div>
            </div>
            <div className="flex gap-3 text-sm">
              {idx > 0 && (
                <button className="underline" onClick={() => saveOrder(swap(idx, idx - 1))}>
                  ↑ 上へ
                </button>
              )}
              {idx < data.items.length - 1 && (
                <button className="underline" onClick={() => saveOrder(swap(idx, idx + 1))}>
                  ↓ 下へ
                </button>
              )}
              <button className="underline text-red-600" onClick={() => removeItem(it.id)}>
                削除
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
