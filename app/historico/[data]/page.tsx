import { redirect } from 'next/navigation'
import { getSession } from '@/app/lib/session'
import HistoricoDetalhes from '@/app/components/HistoricoDetalhes'

interface Props {
  params: Promise<{ data: string }>
}

export default async function HistoricoDetalhesPage({ params }: Props) {
  const session = await getSession()
  const { data } = await params

  if (!session) {
    redirect('/login')
  }

  return <HistoricoDetalhes data={data} />
}
