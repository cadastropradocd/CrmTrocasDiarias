import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import path from 'path'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createSqliteClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db'
  console.log('[prisma] Connecting to SQLite (local dev)')
  const dbPath = dbUrl.replace('file:', '')
  const absolutePath = path.resolve(process.cwd(), dbPath)
  console.log('[prisma] Database path:', absolutePath)
  const adapter = new PrismaBetterSqlite3({ url: `file:${absolutePath}` })
  return new PrismaClient({ adapter })
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createSqliteClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma