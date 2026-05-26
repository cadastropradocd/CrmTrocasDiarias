import { cookies } from 'next/headers'
import { verifyToken } from './auth'
import { Role } from './types'

const SESSION_COOKIE = 'session'

/**
 * Única fonte da verdade para sessão server-side.
 * Lê exclusivamente o cookie HttpOnly 'session' e verifica o JWT.
 * Não depende de sessionStorage ou Authorization header.
 *
 * Implements defense-in-depth: handles edge cases gracefully.
 */
export async function getSession(): Promise<{ username: string; name: string; role: Role } | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (!token || typeof token !== 'string') return null
    return verifyToken(token)
  } catch (error) {
    console.error('[getSession] Error getting session:', error)
    return null
  }
}