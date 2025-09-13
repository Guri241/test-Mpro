import { redirect } from 'next/navigation'
import { prisma } from './lib/prisma'

export default async function Home() {

  const s = await prisma.session.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })

  if (!s) redirect('/setup')

  redirect(`/sessions/${s.id}`)
}
