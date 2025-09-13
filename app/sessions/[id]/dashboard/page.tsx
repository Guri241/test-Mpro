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

export default function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, isLoading } = useSWR(`/api/sessions/${id}`, fetcher)

  if (isLoading || !data) {
    return (
      <div className="min-h-dvh grid place-items-center bg-gradient-to-b from-gray-50 to-white dark:from-zinc-900 dark:to-black">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading…</div>
      </div>
    )
  }

  // seriesMap[itemId] = [turn1, turn2, ...]
  const seriesMap: Record<string, number[]> = {}
  let maxLen = 0
  for (const it of data.items as any[]) {
    const responsesForItem = (data.responses as any[])
      .filter((r: any) => r.itemId === it.id)
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    const arr: number[] = []
    for (const r of responsesForItem) {
      const num = toNumber(r.value)
      if (num !== null) arr.push(num)
    }
    seriesMap[it.id] = arr
    if (arr.length > maxLen) maxLen = arr.length
  }

  const chartData: any[] = []
  for (let k = 0; k < maxLen; k++) {
    const row: any = { turn: k + 1 }
    for (const it of data.items as any[]) row[it.label] = seriesMap[it.id]?.[k] ?? null
    chartData.push(row)
  }

  const palette = ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ca8a04', '#0ea5e9', '#db2777', '#059669']

  return (
    <main className="min-h-dvh bg-gradient-to-b from-gray-50 to-white dark:from-zinc-900 dark:to-black">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 border-b border-gray-200/60 dark:border-white/10 backdrop-blur bg-white/70 dark:bg-zinc-900/70">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              {data.session.name ?? 'セッション'}：折れ線グラフ
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              入力回数 × 項目の推移
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
                {(data.items as any[]).map((it: any, i: number) => (
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
                    <div className="mt-6 rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-zinc-900/70 backdrop-blur shadow-sm overflow-x-auto">
                      <table className="min-w-[720px] w-full text-base">
                        <thead className="bg-gray-50/80 dark:bg-zinc-800/60">
                          <tr>
                            <th className="px-4 py-3 text-left w-16 font-bold text-lg">回</th>
                            {(data.items as any[]).map((it: any) => (
                              <th key={it.id} className="px-4 py-3 text-left font-bold text-lg">
                                {it.label}
                                {it.unit ? (
                                  <span className="text-sm text-gray-500 ml-1">（{it.unit}）</span>
                                ) : null}
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
                              {(data.items as any[]).map((it: any) => (
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
