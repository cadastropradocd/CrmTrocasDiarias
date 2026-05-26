import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { comparePassword, signToken } from '@/app/lib/auth'

export async function POST(req: Request) {
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

    const { data: user, error } = await supabase
      .from('User')
      .select('*')
      .eq('username', username)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Usuário ou senha inválidos' }, { status: 401 })
    }

    const valid = await comparePassword(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Usuário ou senha inválidos' }, { status: 401 })
    }

    const token = signToken({ username: user.username, name: user.name, role: user.role })

    const response = NextResponse.json({ token, name: user.name, role: user.role })
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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