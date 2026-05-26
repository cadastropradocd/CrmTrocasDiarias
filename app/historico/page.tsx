import { redirect } from 'next/navigation'
import { getSession } from '@/app/lib/session'
import HistoricoList from '@/app/components/HistoricoList'

export default async function HistoricoPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  const isAdmin = session.role === 'ADMIN'

  return (
    <HistoricoList
      isAdmin={isAdmin}
    />
  )
}
