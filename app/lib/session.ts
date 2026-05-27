import { cookies } from 'next/headers'
import { verifyToken } from './auth'
import type { Role } from './types'

export async function getSession(): Promise<{ username: string; name: string; role: Role } | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session')?.value
    if (!token || typeof token !== 'string') return null

    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'
    return await verifyToken(token, JWT_SECRET)
  } catch (error) {
    console.error('[getSession] Error:', error)
    return null
  }
}