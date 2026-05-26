import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/session'
import { verifyToken } from '@/app/lib/auth'
import { Role } from '@/app/lib/types'
import { getDepartamentosAtivos } from '@/app/lib/db'
import { getTrocaDiaByDate, getOrCreateTrocaDia } from '@/app/lib/db'
import { getRegistrosByTrocaDiaId, upsertRegistros } from '@/app/lib/db'

function todayString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const today = todayString()

  const departamentos = await getDepartamentosAtivos()

  const trocaDia = await getTrocaDiaByDate(today)

  const registros: Record<string, { realizado: number; meta: number }> = {}
  if (trocaDia) {
    const regs = await getRegistrosByTrocaDiaId(trocaDia.id)
    for (const r of regs) {
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
    trocasDiariasId: trocaDia?.id || null,
  })
}

export async function PUT(req: Request) {
  let userRole: Role = 'USER'

  const session = await getSession()
  if (session) {
    userRole = session.role
  } else {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    const decoded = token ? verifyToken(token) : null
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

    const departamentos = await getDepartamentosAtivos()
    const metaMap: Record<string, number> = {}
    for (const d of departamentos) {
      metaMap[d.nome] = d.meta
    }

    const trocaDia = await getOrCreateTrocaDia(today)

    const registrosParaSalvar = registros.map((reg) => ({
      departamentoId: null,
      categoria: reg.nome,
      realizado: reg.realizado,
      meta: metaMap[reg.nome] ?? reg.meta,
    }))

    await upsertRegistros(trocaDia.id, registrosParaSalvar)

    return NextResponse.json({ success: true, data: today })
  } catch (err) {
    console.error('[trocas] ERROR:', err)
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}
