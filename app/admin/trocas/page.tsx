import { redirect } from 'next/navigation'
import { getSession } from '@/app/lib/session'
import Dashboard from '@/app/components/Dashboard'

export default async function TrocasPage() {
  const session = await getSession()

  if (!session || session.role !== 'ADMIN') {
    redirect('/login')
  }

  return <Dashboard editable={true} readonlyBanner={false} />
}