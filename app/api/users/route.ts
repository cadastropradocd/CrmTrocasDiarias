import { NextResponse } from 'next/server'
import type { Role } from '@/app/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const res = await fetch('/api/users')
  const data = await res.json()
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cookie': req.headers.get('cookie') || '' },
      body: JSON.stringify(body),
    })
    return NextResponse.json(await res.json(), { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}

export async function DELETE(req: Request) {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  
  const res = await fetch(`/api/users?id=${id}`, {
    method: 'DELETE',
    headers: { 'cookie': req.headers.get('cookie') || '' },
  })
  return NextResponse.json(await res.json())
}