import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import path from 'path'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db'

  // Check if DATABASE_URL contains postgresql (more robust check)
  if (dbUrl && dbUrl.toLowerCase().includes('postgresql')) {
    console.log('[prisma] Connecting to PostgreSQL (Supabase)')
    console.log('[prisma] Using connection string:', dbUrl.replace(/:\w+@/, ':***@'))
    const pool = new pg.Pool({ connectionString: dbUrl })
    const adapter = new PrismaPg(pool)
    return new PrismaClient({ adapter })
  }

  // SQLite (local dev)
  console.log('[prisma] Connecting to SQLite (local dev)')
  const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')
  const dbPath = dbUrl.replace('file:', '')
  const absolutePath = path.resolve(process.cwd(), dbPath)
  console.log('[prisma] Database path:', absolutePath)
  const adapter = new PrismaBetterSqlite3({ url: `file:${absolutePath}` })
  return new PrismaClient({ adapter })
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma