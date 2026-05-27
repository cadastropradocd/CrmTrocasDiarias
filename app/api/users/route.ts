import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, hashPassword } from '@/app/lib/auth'
import type { Role } from '@/app/lib/types'

export const runtime = 'edge'

type Env = { DB: D1Database; JWT_SECRET: string }

function getSessionCookie(req: Request): string | null {
  const cookieHeader = req.headers.get('cookie')
  if (!cookieHeader) return null
  const match = cookieHeader.split(';').find(c => c.trim().startsWith('session='))
  return match ? match.split('=')[1]?.trim() : null
}

async function requireAdmin(env: Env, req: Request) {
  const cookie = getSessionCookie(req)
  if (!cookie) return null
  const session = await verifyToken(cookie, env.JWT_SECRET)
  if (!session || session.role !== 'ADMIN') return null
  return session
}

export async function GET(req: Request, context: { env: Env }) {
  const { env } = context
  try {
    const session = await requireAdmin(env, req)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const result = await env.DB.prepare('SELECT id, username, name, role, created_at FROM users ORDER BY name').all()
    return NextResponse.json(result.results)
  } catch (error) {
    console.error('GET /api/users error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, context: { env: Env }) {
  const { env } = context
  try {
    const session = await requireAdmin(env, req)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { username, password, name, role } = body

    if (!username || typeof username !== 'string' || !username.trim()) {
      return NextResponse.json({ error: 'Username é obrigatório' }, { status: 400 })
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, { status: 400 })
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const result = await env.DB.prepare('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)').bind(username.trim(), hashedPassword, name.trim(), role === 'ADMIN' ? 'ADMIN' : 'USER').run()

    const user = await env.DB.prepare('SELECT id, username, name, role, created_at FROM users WHERE id = ?').bind(result.meta?.last_row_id).first()

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('POST /api/users error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { env: Env }) {
  const { env } = context
  try {
    const session = await requireAdmin(env, req)
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get('id') || '')

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/users error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}