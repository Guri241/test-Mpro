import Link from 'next/link'

async function getSessions() {
  const res = await fetch('http://localhost:3000/api/sessions', { cache: 'no-store' })
  return res.json()
}

export default async function SessionsPage() {
  const data = await getSessions()
  return (
    <main className="p-6 space-y-4">
      
      <h1 className="text-2xl font-bold">セッション一覧</h1>
      <ul className="space-y-2">
        {data.map((s: any) => (
          <li key={s.id} className="border rounded p-4 hover:bg-gray-50">
            <Link href={`/sessions/${s.id}`}>
              <div className="font-semibold">{s.name}</div>
              <div className="text-sm text-gray-500">{s.product?.name ?? '-'}</div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
