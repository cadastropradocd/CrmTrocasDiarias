import { NextRequest, NextResponse } from 'next/server'
import { comparePassword, signToken } from '@/app/lib/auth'
import type { Role } from '@/app/lib/types'

export const runtime = 'edge'

type Env = { DB: D1Database; JWT_SECRET: string }

export async function POST(req: NextRequest, context: { env: Env }) {
  const { env } = context
  try {
    let username: string, password: string

    try {
      const body = await req.json()
      if (typeof body.username !== 'string' || typeof body.password !== 'string') {
        return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
      }
      username = body.username.trim()
      password = body.password
    } catch {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuário e senha são obrigatórios' }, { status: 400 })
    }

    const userResult = await env.DB.prepare(
      'SELECT id, username, password, name, role FROM users WHERE username = ?'
    ).bind(username).first<{ id: number; username: string; password: string; name: string; role: Role }>()

    if (!userResult) {
      return NextResponse.json({ error: 'Usuário ou senha inválidos' }, { status: 401 })
    }

    const valid = await comparePassword(password, userResult.password)
    if (!valid) {
      return NextResponse.json({ error: 'Usuário ou senha inválidos' }, { status: 401 })
    }

    const token = await signToken({ username: userResult.username, name: userResult.name, role: userResult.role }, env.JWT_SECRET)

    const response = NextResponse.json({ token, name: userResult.name, role: userResult.role })
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('[login] Full error:', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}