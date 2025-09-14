import { redirect } from 'next/navigation'
import { prisma } from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Home() {

  const latest = await prisma.session.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })


  if (!latest) redirect('/setup')


  redirect(`/sessions/${latest.id}`)
}
