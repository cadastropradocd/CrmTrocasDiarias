import { redirect } from 'next/navigation'
import { getSession } from '@/app/lib/session'
import Dashboard from '@/app/components/Dashboard'

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  const isAdmin = session.role === 'ADMIN'

  return <Dashboard editable={isAdmin} readonlyBanner={!isAdmin} />
}
