import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/session'
import { getTrocaDiaByDate } from '@/app/lib/db'
import { getRegistrosByTrocaDiaId } from '@/app/lib/db'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const data = searchParams.get('data')

  if (!data) {
    return NextResponse.json({ error: 'Data é obrigatória' }, { status: 400 })
  }

  const trocaDia = await getTrocaDiaByDate(data)
  if (!trocaDia) {
    return NextResponse.json({ error: 'Nenhum registro para esta data' }, { status: 404 })
  }

  const registros = await getRegistrosByTrocaDiaId(trocaDia.id)

  const totalRealizado = registros.reduce((sum, r) => sum + r.realizado, 0)
  const totalMeta = registros.reduce((sum, r) => sum + r.meta, 0)

  return NextResponse.json({
    data: trocaDia.data,
    registros,
    totalRealizado,
    totalMeta,
    diferenca: totalRealizado - totalMeta,
  })
}
