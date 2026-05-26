import HistoricoDetalhes from '@/app/components/HistoricoDetalhes'

interface Props {
  params: Promise<{ data: string }>
}

export default async function ComercialHistoricoDetalhesPage({ params }: Props) {
  const { data } = await params
  return <HistoricoDetalhes data={data} />
}
