import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/app/lib/auth'
import type { Role } from '@/app/lib/types'

export const runtime = 'edge'

type Env = { DB: D1Database; JWT_SECRET: string }

function todayString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

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

  const today = todayString()

  const departamentosResult = await env.DB.prepare('SELECT id, nome, meta FROM departamentos WHERE ativo = 1 ORDER BY nome').all()
  const departamentos = departamentosResult.results as { id: number; nome: string; meta: number }[]

  const trocaDiaResult = await env.DB.prepare('SELECT id FROM trocas_dias WHERE data = ?').bind(today).first<{ id: number }>()

  const registros: Record<string, { realizado: number; meta: number }> = {}
  if (trocaDiaResult) {
    const regsResult = await env.DB.prepare('SELECT categoria, realizado, meta FROM registros WHERE trocas_dia_id = ?').bind(trocaDiaResult.id).all()
    for (const r of regsResult.results as { categoria: string; realizado: number; meta: number }[]) {
      registros[r.categoria] = { realizado: r.realizado, meta: r.meta }
    }
  }

  const result = departamentos.map((d) => {
    const reg = registros[d.nome] || { realizado: 0, meta: 0 }
    return {
      id: d.id,
      nome: d.nome,
      meta: d.meta,
      realizado: reg.realizado,
    }
  })

  return NextResponse.json({
    data: today,
    departamentos: result,
    trocasDiariasId: trocaDiaResult?.id || null,
  })
}

export async function PUT(req: Request, context: { env: Env }) {
  const { env } = context
  const cookie = getSessionCookie(req)
  let userRole: Role = 'USER'

  if (cookie) {
    const session = await verifyToken(cookie, env.JWT_SECRET)
    if (session) {
      userRole = session.role
    }
  }

  if (!cookie || !await verifyToken(cookie, env.JWT_SECRET)) {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    const decoded = token ? await verifyToken(token, env.JWT_SECRET) : null
    if (!decoded) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    userRole = decoded.role
  }

  if (userRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Apenas o admin pode editar' }, { status: 403 })
  }

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    const payload = body as Record<string, unknown>

    if (!Array.isArray(payload.registros)) {
      return NextResponse.json({ error: 'Registros inválidos' }, { status: 400 })
    }

    const registros = payload.registros.map((r: unknown) => {
      if (typeof r !== 'object' || r === null) {
        throw new Error('Registro inválido')
      }
      const reg = r as Record<string, unknown>
      if (typeof reg.nome !== 'string' || !reg.nome) {
        throw new Error('Nome inválido')
      }
      if (typeof reg.realizado !== 'number' || !Number.isFinite(reg.realizado)) {
        throw new Error('Realizado inválido')
      }
      return {
        nome: String(reg.nome),
        realizado: Number(reg.realizado),
        meta: typeof reg.meta === 'number' && Number.isFinite(reg.meta) ? Number(reg.meta) : 0,
      }
    })

    const today = todayString()

    const deptResult = await env.DB.prepare('SELECT nome, meta FROM departamentos WHERE ativo = 1').all()
    const metaMap: Record<string, number> = {}
    for (const d of deptResult.results as { nome: string; meta: number }[]) {
      metaMap[d.nome] = d.meta
    }

    let trocaDiaId: number

    const existingTroca = await env.DB.prepare('SELECT id FROM trocas_dias WHERE data = ?').bind(today).first<{ id: number }>()
    if (existingTroca) {
      trocaDiaId = existingTroca.id
    } else {
      const insertResult = await env.DB.prepare('INSERT INTO trocas_dias (data) VALUES (?)').bind(today).run()
      trocaDiaId = insertResult.meta?.last_row_id as number
    }

    await env.DB.prepare('DELETE FROM registros WHERE trocas_dia_id = ?').bind(trocaDiaId).run()

    for (const reg of registros) {
      await env.DB.prepare('INSERT INTO registros (categoria, realizado, meta, trocas_dia_id) VALUES (?, ?, ?, ?)').bind(reg.nome, reg.realizado, metaMap[reg.nome] ?? reg.meta, trocaDiaId).run()
    }

    return NextResponse.json({ success: true, data: today })
  } catch (err) {
    console.error('[trocas] ERROR:', err)
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}