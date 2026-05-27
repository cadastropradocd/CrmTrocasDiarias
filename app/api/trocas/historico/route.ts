import { NextResponse } from 'next/server'
import { verifyToken } from '@/app/lib/auth'

export const runtime = 'edge'

type Env = { DB: D1Database; JWT_SECRET: string }

function getSessionCookie(req: Request): string | null {
  const cookieHeader = req.headers.get('cookie')
  if (!cookieHeader) return null
  const match = cookieHeader.split(';').find(c => c.trim().startsWith('session='))
  return match ? match.split('=')[1]?.trim() : null
}

export async function GET(req: Request, context: { env: Env }) {
  const { env } = context
  const cookie = getSessionCookie(req)
  if (!cookie) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const session = await verifyToken(cookie, env.JWT_SECRET)
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const result = await env.DB.prepare(`
    SELECT
      td.id,
      td.data,
      COALESCE(SUM(r.realizado), 0) as totalRealizado,
      COALESCE(SUM(r.meta), 0) as totalMeta,
      COALESCE(SUM(r.meta), 0) - COALESCE(SUM(r.realizado), 0) as diferenca
    FROM trocas_dias td
    LEFT JOIN registros r ON r.trocas_dia_id = td.id
    GROUP BY td.id, td.data
    ORDER BY td.data DESC
  `).all()

  return NextResponse.json(result.results)
}