import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { comparePassword, signToken } from '@/app/lib/auth'

export async function POST(req: Request) {
  try {
    const raw = await req.text()
    const { username, password } = JSON.parse(raw)

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuário e senha são obrigatórios' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { username } })

    if (!user) {
      return NextResponse.json({ error: 'Usuário ou senha inválidos' }, { status: 401 })
    }

    const valid = await comparePassword(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Usuário ou senha inválidos' }, { status: 401 })
    }

    const token = signToken({ email: user.username, name: user.name, role: user.role })

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