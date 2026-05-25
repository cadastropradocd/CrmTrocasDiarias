import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Role } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production')
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
    throw new Error('JWT_SECRET is not configured')
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

/**
 * Verifica token JWT.
 * Retorna null se token inválido ou expirado.
 */
export function verifyToken(token: string): { username: string; name: string; role: Role } | null {
  if (!JWT_SECRET) {
    return null
  }
  try {
    return jwt.verify(token, JWT_SECRET) as { username: string; name: string; role: Role }
  } catch {
    return null
  }
}