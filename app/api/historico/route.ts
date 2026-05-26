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
    .select('id, data, createdAt')
    .order('data', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 })
  }

  return NextResponse.json(trocas)
}