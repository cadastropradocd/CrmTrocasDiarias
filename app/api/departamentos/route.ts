import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/app/lib/auth'
import type { Role } from '@/app/lib/db'

export const runtime = 'edge'

type Env = { DB: D1Database; JWT_SECRET: string }

async function requireAdmin(env: Env, cookie: string | null) {
  if (!cookie) return null
  const session = verifyToken(cookie)
  if (!session || session.role !== 'ADMIN') return null
  return session
}

export async function GET(req: Request, { env }: { env: Env }) {
  try {
    const cookie = req.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('session='))?.split('=')[1]
    const session = await requireAdmin(env, cookie ? `session=${cookie.split(';')[0].trim()}` : null)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const result = await env.DB.prepare('SELECT * FROM departamentos ORDER BY nome').all()
    return NextResponse.json(result.results)
  } catch (error) {
    console.error('GET /api/departamentos error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { env }: { env: Env }) {
  try {
    const cookie = req.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('session='))?.split('=')[1]
    const session = await requireAdmin(env, cookie ? `session=${cookie.split(';')[0].trim()}` : null)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { nome, meta } = body

    if (!nome || typeof nome !== 'string' || !nome.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    if (typeof meta !== 'number' || meta < 0) {
      return NextResponse.json({ error: 'Meta inválida' }, { status: 400 })
    }

    const exists = await env.DB.prepare('SELECT id FROM departamentos WHERE UPPER(nome) = ?').bind(nome.trim().toUpperCase()).first()
    if (exists) {
      return NextResponse.json({ error: 'Já existe um departamento com este nome' }, { status: 409 })
    }

    const result = await env.DB.prepare('INSERT INTO departamentos (nome, meta) VALUES (?, ?)').bind(nome.trim(), meta).run()

    const departamento = await env.DB.prepare('SELECT * FROM departamentos WHERE id = ?').bind(result.meta?.last_row_id).first()

    return NextResponse.json(departamento, { status: 201 })
  } catch (error) {
    console.error('POST /api/departamentos error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { env }: { env: Env }) {
  try {
    const cookie = req.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('session='))?.split('=')[1]
    const session = await requireAdmin(env, cookie ? `session=${cookie.split(';')[0].trim()}` : null)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get('id') || '')

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await req.json()
    const { nome, meta } = body

    if (!nome || typeof nome !== 'string' || !nome.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    if (typeof meta !== 'number' || meta < 0) {
      return NextResponse.json({ error: 'Meta inválida' }, { status: 400 })
    }

    const exists = await env.DB.prepare('SELECT id FROM departamentos WHERE UPPER(nome) = ? AND id != ?').bind(nome.trim().toUpperCase(), id).first()
    if (exists) {
      return NextResponse.json({ error: 'Já existe outro departamento com este nome' }, { status: 409 })
    }

    await env.DB.prepare('UPDATE departamentos SET nome = ?, meta = ? WHERE id = ?').bind(nome.trim().toUpperCase(), meta, id).run()

    const departamento = await env.DB.prepare('SELECT * FROM departamentos WHERE id = ?').bind(id).first()
    return NextResponse.json(departamento)
  } catch (error) {
    console.error('PUT /api/departamentos error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { env }: { env: Env }) {
  try {
    const cookie = req.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('session='))?.split('=')[1]
    const session = await requireAdmin(env, cookie ? `session=${cookie.split(';')[0].trim()}` : null)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get('id') || '')

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await req.json()

    if ('ativo' in body) {
      await env.DB.prepare('UPDATE departamentos SET ativo = ? WHERE id = ?').bind(body.ativo ? 1 : 0, id).run()
      const departamento = await env.DB.prepare('SELECT * FROM departamentos WHERE id = ?').bind(id).first()
      return NextResponse.json(departamento)
    }

    const updates: string[] = []
    const values: (string | number)[] = []

    if ('nome' in body && typeof body.nome === 'string') {
      updates.push('nome = ?')
      values.push(body.nome.trim().toUpperCase())
    }
    if ('meta' in body && typeof body.meta === 'number') {
      updates.push('meta = ?')
      values.push(body.meta)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    values.push(id)
    await env.DB.prepare(`UPDATE departamentos SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()

    const departamento = await env.DB.prepare('SELECT * FROM departamentos WHERE id = ?').bind(id).first()
    return NextResponse.json(departamento)
  } catch (error) {
    console.error('PATCH /api/departamentos error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { env }: { env: Env }) {
  try {
    const cookie = req.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('session='))?.split('=')[1]
    const session = await requireAdmin(env, cookie ? `session=${cookie.split(';')[0].trim()}` : null)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get('id') || '')

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    await env.DB.prepare('DELETE FROM departamentos WHERE id = ?').bind(id).run()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/departamentos error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}