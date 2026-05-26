import { redirect } from 'next/navigation'
import { getSession } from '@/app/lib/session'
import HistoricoDetalhes from '@/app/components/HistoricoDetalhes'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ data: string }>
}

export default async function HistoricoDataPage({ params }: Props) {
  const session = await getSession()

  if (!session || session.role !== 'ADMIN') {
    redirect('/login')
  }

  const { data } = await params

  return <HistoricoDetalhes data={data} basePath="/admin/historico" />
}