import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Role } from './types'

const JWT_SECRET = process.env.JWT_SECRET

const isProduction = process.env.NODE_ENV === 'production'

if (!JWT_SECRET) {
  console.error('[auth] JWT_SECRET não está definido!')
  if (isProduction) {
    console.error('[auth] ERRO CRÍTICO: Variável JWT_SECRET necessária em produção')
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Gera JWT com payload contendo username, name e role.
 * Cookie HttpOnly é a fonte da verdade para sessão server-side.
 * O cliente mantém uma cópia no sessionStorage apenas para uso no Authorization header.
 */
export function signToken(payload: { username: string; name: string; role: Role }): string {
  if (!JWT_SECRET) {
    const error = 'JWT_SECRET is not configured'
    console.error('[auth]', error)
    throw new Error(error)
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

/**
 * Verifica token JWT.
 * Retorna null se token inválido ou expirado.
 * Handles gracefully em ambos ambientes.
 */
export function verifyToken(token: string): { username: string; name: string; role: Role } | null {
  if (!JWT_SECRET) {
    console.warn('[auth] JWT_SECRET not configured, rejecting token')
    return null
  }
  if (!token || typeof token !== 'string') {
    return null
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (
      typeof decoded === 'object' &&
      decoded !== null &&
      'username' in decoded &&
      'name' in decoded &&
      'role' in decoded
    ) {
      return decoded as { username: string; name: string; role: Role }
    }
    return null
  } catch (error) {
    console.warn('[auth] Token verification failed:', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}