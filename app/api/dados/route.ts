import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getSession } from '@/app/lib/session'
import { verifyToken } from '@/app/lib/auth'
import { Role } from '@/app/lib/types'

function toDateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0))
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get('date')

  let data: Date
  if (dateStr) {
    const parsed = new Date(dateStr + 'T00:00:00Z')
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'Data inválida' }, { status: 400 })
    }
    data = toDateOnly(parsed)
  } else {
    data = toDateOnly(new Date())
  }

  const session = await getSession()
  if (!session) {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
  }

  const trocaDia = await prisma.trocaDia.findUnique({
    where: { data },
    include: {
      registros: {
        orderBy: { categoria: 'asc' },
      },
    },
  })

  if (!trocaDia) {
    return NextResponse.json(null)
  }

  return NextResponse.json(trocaDia)
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

    // Validação de date
    if (typeof payload.date !== 'string' || !payload.date) {
      return NextResponse.json({ error: 'Data inválida' }, { status: 400 })
    }
    const dateObj = new Date(payload.date + 'T00:00:00Z')
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: 'Data inválida' }, { status: 400 })
    }

    // Validação de registros
    if (!Array.isArray(payload.registros)) {
      return NextResponse.json({ error: 'Registros inválidos' }, { status: 400 })
    }

    const registros = payload.registros.map((r: unknown) => {
      if (typeof r !== 'object' || r === null) {
        throw new Error('Registro inválido')
      }
      const reg = r as Record<string, unknown>
      if (typeof reg.categoria !== 'string' || !reg.categoria) {
        throw new Error('Categoria inválida')
      }
      if (typeof reg.realizado !== 'number' || !Number.isFinite(reg.realizado)) {
        throw new Error('Realizado inválido')
      }
      if (typeof reg.meta !== 'number' || !Number.isFinite(reg.meta)) {
        throw new Error('Meta inválida')
      }
      return {
        categoria: String(reg.categoria),
        realizado: Number(reg.realizado),
        meta: Number(reg.meta),
      }
    })

    const utcDate = toDateOnly(dateObj)

    let trocaDia = await prisma.trocaDia.findUnique({ where: { data: utcDate } })
    if (!trocaDia) {
      trocaDia = await prisma.trocaDia.create({ data: utcDate as never })
    }

    for (const reg of registros) {
      await prisma.registro.upsert({
        where: { trocaDiaId_categoria: { trocaDiaId: trocaDia.id, categoria: reg.categoria } },
        update: { realizado: reg.realizado, meta: reg.meta },
        create: { trocaDiaId: trocaDia.id, categoria: reg.categoria, realizado: reg.realizado, meta: reg.meta },
      })
    }

    const updated = await prisma.trocaDia.findUnique({
      where: { id: trocaDia.id },
      include: { registros: { orderBy: { categoria: 'asc' } } },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('[dados] ERROR:', err)
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}