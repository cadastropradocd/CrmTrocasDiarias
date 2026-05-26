import { redirect } from 'next/navigation'
import { getSession } from '@/app/lib/session'
import HistoricoList from '@/app/components/HistoricoList'

export const dynamic = 'force-dynamic'

export default async function HistoricoPage() {
  const session = await getSession()

  if (!session || session.role !== 'ADMIN') {
    redirect('/login')
  }

  return <HistoricoList />
}