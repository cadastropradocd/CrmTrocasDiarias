import { PrismaClient, Role } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db'

  // PostgreSQL (Supabase)
  if (dbUrl.startsWith('postgresql')) {
    console.log('[seed] Connecting to PostgreSQL (Supabase)')
    const pool = new pg.Pool({ connectionString: dbUrl })
    const adapter = new PrismaPg(pool)
    return new PrismaClient({ adapter })
  }

  // SQLite (local dev)
  console.log('[seed] Connecting to SQLite (local dev)')
  const path = dbUrl.replace('file:', '')
  const absolutePath = path.resolve(process.cwd(), path)
  const adapter = new PrismaBetterSqlite3({ url: `file:${absolutePath}` })
  return new PrismaClient({ adapter })
}

const prisma = createPrismaClient()

function toDateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0))
}

function subDays(d: Date, n: number): Date {
  const result = new Date(d)
  result.setDate(result.getDate() - n)
  return toDateOnly(result)
}

const USUARIOS = [
  { username: 'cadastro', password: '160922', name: 'Cadastro', role: 'ADMIN' as Role },
  { username: 'comercial', password: '123456', name: 'Comercial', role: 'USER' as Role },
]

const HISTORICO_DATA: Array<{ data: Date; valores: Array<{ categoria: string; realizado: number; meta: number }> }> = [
  {
    data: toDateOnly(new Date()),
    valores: [
      { categoria: 'AÇOUGUE', realizado: 5267.7, meta: 3000 },
      { categoria: 'BAZAR/ELETRO/FLORES', realizado: 2803.23, meta: 5000 },
      { categoria: 'PETSHOP', realizado: 933.87, meta: 2000 },
      { categoria: 'BEBIDAS', realizado: 21429.61, meta: 7000 },
      { categoria: 'FLC', realizado: 14087.31, meta: 18000 },
      { categoria: 'HIGIENE', realizado: 4537.61, meta: 3500 },
      { categoria: 'PADARIA', realizado: 1883.13, meta: 4000 },
      { categoria: 'LIMPEZA', realizado: 3507.2, meta: 3500 },
      { categoria: 'MERCEARIA', realizado: 50600.61, meta: 47000 },
    ],
  },
  {
    data: subDays(new Date(), 1),
    valores: [
      { categoria: 'AÇOUGUE', realizado: 4100.0, meta: 3000 },
      { categoria: 'BAZAR/ELETRO/FLORES', realizado: 3200.5, meta: 5000 },
      { categoria: 'PETSHOP', realizado: 1200.0, meta: 2000 },
      { categoria: 'BEBIDAS', realizado: 18500.0, meta: 7000 },
      { categoria: 'FLC', realizado: 15500.0, meta: 18000 },
      { categoria: 'HIGIENE', realizado: 3800.0, meta: 3500 },
      { categoria: 'PADARIA', realizado: 2100.0, meta: 4000 },
      { categoria: 'LIMPEZA', realizado: 3300.0, meta: 3500 },
      { categoria: 'MERCEARIA', realizado: 48000.0, meta: 47000 },
    ],
  },
  {
    data: subDays(new Date(), 2),
    valores: [
      { categoria: 'AÇOUGUE', realizado: 3800.0, meta: 3000 },
      { categoria: 'BAZAR/ELETRO/FLORES', realizado: 4500.0, meta: 5000 },
      { categoria: 'PETSHOP', realizado: 1100.0, meta: 2000 },
      { categoria: 'BEBIDAS', realizado: 19200.0, meta: 7000 },
      { categoria: 'FLC', realizado: 17000.0, meta: 18000 },
      { categoria: 'HIGIENE', realizado: 3600.0, meta: 3500 },
      { categoria: 'PADARIA', realizado: 1900.0, meta: 4000 },
      { categoria: 'LIMPEZA', realizado: 3400.0, meta: 3500 },
      { categoria: 'MERCEARIA', realizado: 49000.0, meta: 47000 },
    ],
  },
  {
    data: subDays(new Date(), 3),
    valores: [
      { categoria: 'AÇOUGUE', realizado: 4200.0, meta: 3000 },
      { categoria: 'BAZAR/ELETRO/FLORES', realizado: 2900.0, meta: 5000 },
      { categoria: 'PETSHOP', realizado: 950.0, meta: 2000 },
      { categoria: 'BEBIDAS', realizado: 20500.0, meta: 7000 },
      { categoria: 'FLC', realizado: 16500.0, meta: 18000 },
      { categoria: 'HIGIENE', realizado: 3900.0, meta: 3500 },
      { categoria: 'PADARIA', realizado: 2000.0, meta: 4000 },
      { categoria: 'LIMPEZA', realizado: 3600.0, meta: 3500 },
      { categoria: 'MERCEARIA', realizado: 47500.0, meta: 47000 },
    ],
  },
  {
    data: subDays(new Date(), 4),
    valores: [
      { categoria: 'AÇOUGUE', realizado: 3900.0, meta: 3000 },
      { categoria: 'BAZAR/ELETRO/FLORES', realizado: 4100.0, meta: 5000 },
      { categoria: 'PETSHOP', realizado: 1050.0, meta: 2000 },
      { categoria: 'BEBIDAS', realizado: 17800.0, meta: 7000 },
      { categoria: 'FLC', realizado: 16000.0, meta: 18000 },
      { categoria: 'HIGIENE', realizado: 3700.0, meta: 3500 },
      { categoria: 'PADARIA', realizado: 1850.0, meta: 4000 },
      { categoria: 'LIMPEZA', realizado: 3250.0, meta: 3500 },
      { categoria: 'MERCEARIA', realizado: 46200.0, meta: 47000 },
    ],
  },
]

async function main() {
  console.log('Criando usuários...')
  for (const u of USUARIOS) {
    const hashed = await bcrypt.hash(u.password, 10)
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: { username: u.username, password: hashed, name: u.name, role: u.role },
    })
  }
  console.log('Usuários criados.')

  console.log('Inserindo histórico...')
  for (const dia of HISTORICO_DATA) {
    const trocaDia = await prisma.trocaDia.upsert({
      where: { data: dia.data },
      update: {},
      create: { data: dia.data },
    })
    for (const reg of dia.valores) {
      await prisma.registro.upsert({
        where: { trocaDiaId_categoria: { trocaDiaId: trocaDia.id, categoria: reg.categoria } },
        update: { realizado: reg.realizado, meta: reg.meta },
        create: { trocaDiaId: trocaDia.id, categoria: reg.categoria, realizado: reg.realizado, meta: reg.meta },
      })
    }
  }
  console.log('Histórico criado.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())