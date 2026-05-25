// Tipo Role - definido no schema.prisma como enum
export type Role = 'ADMIN' | 'USER'

export const Role = {
  ADMIN: 'ADMIN' as const,
  USER: 'USER' as const,
}

export function isAdmin(role: Role): boolean {
  return role === 'ADMIN'
}

export function isUser(role: Role): boolean {
  return role === 'USER'
}