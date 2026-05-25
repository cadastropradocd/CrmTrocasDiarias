import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/app/lib/auth'

/**
 * Fonte da verdade é o Cookie HttpOnly 'session'.
 * O cliente mantém uma cópia do token no sessionStorage apenas para uso no Authorization header.
 * proxy.ts decide se a requisição pode prosseguir ou deve ser redirecionada.
 */
export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname

  const sessionCookie = req.cookies.get('session')?.value
  const session = sessionCookie ? verifyToken(sessionCookie) : null

  if (path === '/login') {
    if (session) {
      return NextResponse.redirect(new URL(session.role === 'ADMIN' ? '/admin' : '/', req.nextUrl))
    }
    return NextResponse.next()
  }

  if (path === '/admin') {
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', req.nextUrl))
    }
    return NextResponse.next()
  }

  if (path === '/') {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.nextUrl))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}