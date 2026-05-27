import * as jose from 'jose'
import bcrypt from 'bcryptjs'
import type { Role } from './types'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'
const secret = new TextEncoder().encode(JWT_SECRET)

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signToken(payload: { username: string; name: string; role: Role }): string {
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret)
}

export function verifyToken(token: string): { username: string; name: string; role: Role } | null {
  try {
    const { payload } = jose.jwtVerify(token, secret)
    if (
      typeof payload.username === 'string' &&
      typeof payload.name === 'string' &&
      typeof payload.role === 'string'
    ) {
      return payload as { username: string; name: string; role: Role }
    }
    return null
  } catch {
    return null
  }
}