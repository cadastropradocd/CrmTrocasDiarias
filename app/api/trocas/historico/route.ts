import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/session'
import { getTrocasDiasComTotais } from '@/app/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const result = await getTrocasDiasComTotais()
  return NextResponse.json(result)
}
