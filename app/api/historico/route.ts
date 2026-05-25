import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getSession } from '@/app/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const trocas = await prisma.trocaDia.findMany({
    orderBy: { data: 'desc' },
    select: { id: true, data: true, createdAt: true },
  })

  return NextResponse.json(trocas)
}