import { redirect } from 'next/navigation'
import { prisma } from '@/app/lib/prisma'


export const dynamic = 'force-dynamic'

export default async function Home() {
  const s = await prisma.session.findFirst({ select: { id: true } })
  if (!s) redirect('/setup') 
  redirect(`/sessions/${s.id}`) 
}
