import * as jose from 'jose'
import bcrypt from 'bcryptjs'
import type { Role } from './types'

function getSecret(secret: string) {
  return new TextEncoder().encode(secret)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function signToken(payload: { username: string; name: string; role: Role }, secret: string): Promise<string> {
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(getSecret(secret))
}

export async function verifyToken(token: string, secret: string): Promise<{ username: string; name: string; role: Role } | null> {
  try {
    const { payload } = await jose.jwtVerify(token, getSecret(secret))
    if (
      typeof payload.username === 'string' &&
      typeof payload.name === 'string' &&
      typeof payload.role === 'string'
    ) {
      return payload as unknown as { username: string; name: string; role: Role }
    }
    return null
  } catch {
    return null
  }
}