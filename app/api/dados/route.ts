import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { getSession } from '@/app/lib/session'
import { verifyToken } from '@/app/lib/auth'
import { Role } from '@/app/lib/types'

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

  const { data: departamentos, error: deptError } = await supabase
    .from('Departamento')
    .select('id, nome, meta')
    .order('nome', { ascending: true })

  if (deptError) {
    console.error('[dados] Error fetching departamentos:', deptError)
    return NextResponse.json({ error: 'Erro ao buscar departamentos' }, { status: 500 })
  }

  const { data: trocaDia } = await supabase
    .from('TrocaDia')
    .select('id, data')
    .eq('data', today)
    .single()

  let registros: Record<string, { realizado: number; meta: number }> = {}
  if (trocaDia) {
    const { data: regs } = await supabase
      .from('Registro')
      .select('categoria, realizado, meta')
      .eq('trocaDiaId', trocaDia.id)

    if (regs) {
      for (const r of regs) {
        registros[r.categoria] = { realizado: r.realizado, meta: r.meta }
      }
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

    const { data: departamentos } = await supabase
      .from('Departamento')
      .select('id, nome, meta')
      .in('nome', registros.map((r) => r.nome))

    const metaMap: Record<string, number> = {}
    if (departamentos) {
      for (const d of departamentos) {
        metaMap[d.nome] = d.meta
      }
    }

    let trocaDiaId: number

    const { data: existing } = await supabase
      .from('TrocaDia')
      .select('id')
      .eq('data', today)
      .single()

    if (existing) {
      trocaDiaId = existing.id

      await supabase
        .from('Registro')
        .delete()
        .eq('trocaDiaId', trocaDiaId)
    } else {
      const { data: created, error: createError } = await supabase
        .from('TrocaDia')
        .insert({ data: today })
        .select()
        .single()

      if (createError || !created) {
        throw new Error('Erro ao criar TrocaDia')
      }
      trocaDiaId = created.id
    }

    for (const reg of registros) {
      const metaValor = metaMap[reg.nome] ?? reg.meta

      const { error: insertError } = await supabase
        .from('Registro')
        .insert({
          trocaDiaId,
          categoria: reg.nome,
          realizado: reg.realizado,
          meta: metaValor,
        })

      if (insertError) {
        console.error('[dados] Error inserting registro:', insertError)
        throw insertError
      }
    }

    return NextResponse.json({ success: true, data: today })
  } catch (err) {
    console.error('[dados] ERROR:', err)
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}