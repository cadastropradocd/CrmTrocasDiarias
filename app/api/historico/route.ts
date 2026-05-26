import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { getSession } from '@/app/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: trocas, error } = await supabase
    .from('TrocaDia')
    .select('id, data')
    .order('data', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 })
  }

  const result = []
  for (const td of trocas) {
    const { data: regs } = await supabase
      .from('Registro')
      .select('realizado, meta')
      .eq('trocaDiaId', td.id)

    const totalRealizado = regs?.reduce((sum, r) => sum + r.realizado, 0) || 0
    const totalMeta = regs?.reduce((sum, r) => sum + r.meta, 0) || 0

    result.push({
      id: td.id,
      data: td.data,
      totalRealizado,
      totalMeta,
      diferenca: totalRealizado - totalMeta,
    })
  }

  return NextResponse.json(result)
}