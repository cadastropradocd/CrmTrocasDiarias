import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import prisma from '@/app/lib/prisma'
import DateSelector from '@/app/components/DateSelector'
import Dashboard from '@/app/components/Dashboard'

async function getUser(username: string) {
  return await prisma.user.findUnique({ where: { username } })
}

export default async function TrocasPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    redirect('/login')
  }

  const user = await getUser(token)

  if (!user || user.role !== 'ADMIN') {
    redirect('/login')
  }

  return <Dashboard editable={true} readonlyBanner={false} />
}