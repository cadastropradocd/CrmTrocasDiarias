import { cookies } from 'next/headers'
import { verifyToken } from './auth'
import { Role } from '@prisma/client'

const SESSION_COOKIE = 'session'

/**
 * Única fonte da verdade para sessão server-side.
 * Lê exclusivamente o cookie HttpOnly 'session' e verifica o JWT.
 * Não depende de sessionStorage ou Authorization header.
 */
export async function getSession(): Promise<{ username: string; name: string; role: Role } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}