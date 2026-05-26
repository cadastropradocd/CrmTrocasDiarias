import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { getSession } from '@/app/lib/session'

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

  const { data: trocaDia } = await supabase
    .from('TrocaDia')
    .select('id, data')
    .eq('data', data)
    .single()

  if (!trocaDia) {
    return NextResponse.json({ error: 'Nenhum registro para esta data' }, { status: 404 })
  }

  const { data: registros } = await supabase
    .from('Registro')
    .select('categoria, realizado, meta')
    .eq('trocaDiaId', trocaDia.id)

  const totalRealizado = registros?.reduce((sum, r) => sum + r.realizado, 0) || 0
  const totalMeta = registros?.reduce((sum, r) => sum + r.meta, 0) || 0

  return NextResponse.json({
    data: trocaDia.data,
    registros: registros || [],
    totalRealizado,
    totalMeta,
    diferenca: totalRealizado - totalMeta,
  })
}