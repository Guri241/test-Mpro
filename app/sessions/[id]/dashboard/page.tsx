'use client'
import { use } from 'react'
import useSWR from 'swr'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'

const fetcher = (u: string) => fetch(u).then(r => r.json())

function toNumber(v: any): number | null {
  if (v && typeof v === 'object' && 'value' in v) v = (v as any).value
  if (typeof v === 'number') return v
  if (typeof v === 'boolean') return v ? 1 : 0
  if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) return Number(v)
  return null
}

type Timeseries = {
  ok: boolean
  samples: Array<{ itemId: string; value: any; remark?: string | null; sampledAt: string }>
}

export default function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  // ① セッションの基本情報（項目ラベル等）
  const { data: base, isLoading: loadingBase } = useSWR(`/api/sessions/${id}`, fetcher)
  // ② 履歴（保存のたびに増える）
  const { data: ts, isLoading: loadingTs } = useSWR<Timeseries>(`/api/sessions/${id}/timeseries`, fetcher)

  if (loadingBase || loadingTs || !base || !ts) {
    return (
      <div className="min-h-dvh grid place-items-center bg-gradient-to-b from-gray-50 to-white dark:from-zinc-900 dark:to-black">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading…</div>
      </div>
    )
  }

  // itemId -> {label, unit}
  const items: Array<{ id: string; label: string; unit?: string | null }> =
    (base.items as any[]).map((it: any) => ({ id: it.id, label: it.label, unit: it.unit ?? null }))

  // === 重要：保存単位（=同じ sampledAt）でまとめて「回(turn)」を作る ===
  // key は ミリ秒まで含む ISO（slice で丸めない）
  const bySave = new Map<string, Record<string, any>>() // timeISO -> {timeISO, [itemId]: number}
  for (const s of ts.samples) {
    const iso = new Date(s.sampledAt).toISOString()
    const row = bySave.get(iso) ?? { time: iso }
    const num = toNumber(s.value)
    if (num !== null) row[s.itemId] = num
    bySave.set(iso, row)
  }

  // 時間順に並べ、「回(turn)」を 1..N で振り直しつつ、列はラベル名で出す
  const chartData: Array<Record<string, any>> = []
  const timeRows = Array.from(bySave.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  timeRows.forEach(([_, rec], idx) => {
    const row: any = { turn: idx + 1 }
    for (const it of items) {
      const v = rec[it.id]
      row[it.label] = typeof v === 'number' ? v : null
    }
    chartData.push(row)
  })

  const palette = ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ca8a04', '#0ea5e9', '#db2777', '#059669']

  return (
    <main className="min-h-dvh bg-gradient-to-b from-gray-50 to-white dark:from-zinc-900 dark:to-black">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 border-b border-gray-200/60 dark:border-white/10 backdrop-blur bg-white/70 dark:bg-zinc-900/70">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              {base.session?.name ?? 'セッション'}：折れ線グラフ
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              入力回数 × 項目の推移（履歴から生成）
            </p>
          </div>
          <a
            href={`/sessions/${id}`}
            className="hidden sm:inline-flex items-center gap-2 rounded-full border border-gray-300/70 dark:border-white/20 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-700"
          >
            ← 入力へ
          </a>
        </div>
      </div>

      {/* Chart Card */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-zinc-900/70 backdrop-blur shadow-sm p-4">
          <div className="w-full h-[440px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
                <XAxis
                  dataKey="turn"
                  label={{ value: '入力回数', position: 'insideBottom', offset: -5 }}
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {items.map((it, i) => (
                  <Line
                    key={it.id}
                    type="monotone"
                    dataKey={it.label}
                    connectNulls
                    stroke={palette[i % palette.length]}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>

            {/* 表 */}
            <div className="mt-6 rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-zinc-900/70 backdrop-blur shadow-sm overflow-x-auto">
              <table className="min-w-[720px] w-full text-base">
                <thead className="bg-gray-50/80 dark:bg-zinc-800/60">
                  <tr>
                    <th className="px-4 py-3 text-left w-16 font-bold text-lg">回</th>
                    {items.map((it) => (
                      <th key={it.id} className="px-4 py-3 text-left font-bold text-lg">
                        {it.label}
                        {it.unit ? <span className="text-sm text-gray-500 ml-1">（{it.unit}）</span> : null}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((row: any, idx: number) => (
                    <tr
                      key={idx}
                      className="border-t border-gray-100 dark:border-white/10 hover:bg-gray-50/60 dark:hover:bg-zinc-800/50"
                    >
                      <td className="px-4 py-3">{row.turn}</td>
                      {items.map((it) => (
                        <td key={it.id} className="px-4 py-3">
                          {row[it.label] ?? '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>

      {/* Floating Back */}
      <a
        href={`/sessions/${id}`}
        className="fixed left-4 bottom-4 z-50 inline-flex items-center gap-2 rounded-full border border-gray-300/70 dark:border-white/20 bg-white dark:bg-zinc-800 px-4 py-2 text-sm shadow hover:bg-gray-50 dark:hover:bg-zinc-700"
      >
        ← 入力へ
      </a>
    </main>
  )
}
