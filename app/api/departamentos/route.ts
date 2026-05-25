import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getSession } from '@/app/lib/session'

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return null
  }
  return session
}

export async function GET() {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const departamentos = await prisma.departamento.findMany({
      orderBy: { nome: 'asc' },
    })

    return NextResponse.json(departamentos)
  } catch (error) {
    console.error('GET /api/departamentos error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { nome, meta } = body

    if (!nome || typeof nome !== 'string' || !nome.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    if (typeof meta !== 'number' || meta < 0) {
      return NextResponse.json({ error: 'Meta inválida' }, { status: 400 })
    }

    const existing = await prisma.departamento.findUnique({
      where: { nome: nome.trim().toUpperCase() },
    })

    if (existing) {
      return NextResponse.json({ error: 'Já existe um departamento com este nome' }, { status: 409 })
    }

    const departamento = await prisma.departamento.create({
      data: {
        nome: nome.trim().toUpperCase(),
        meta,
      },
    })

    return NextResponse.json(departamento, { status: 201 })
  } catch (error) {
    console.error('POST /api/departamentos error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '')

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await request.json()
    const { nome, meta } = body

    if (!nome || typeof nome !== 'string' || !nome.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    if (typeof meta !== 'number' || meta < 0) {
      return NextResponse.json({ error: 'Meta inválida' }, { status: 400 })
    }

    const existing = await prisma.departamento.findFirst({
      where: {
        nome: nome.trim().toUpperCase(),
        NOT: { id },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Já existe outro departamento com este nome' }, { status: 409 })
    }

    const departamento = await prisma.departamento.update({
      where: { id },
      data: {
        nome: nome.trim().toUpperCase(),
        meta,
      },
    })

    return NextResponse.json(departamento)
  } catch (error) {
    console.error('PUT /api/departamentos error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '')

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await request.json()

    const departamento = await prisma.departamento.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(departamento)
  } catch (error) {
    console.error('PATCH /api/departamentos error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAdmin()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '')

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    await prisma.departamento.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/departamentos error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}