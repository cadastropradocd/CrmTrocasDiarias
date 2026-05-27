import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function proxyRequest(req: Request, path: string) {
  const baseUrl = new URL(req.url).origin
  const url = new URL(req.url)
  const cookie = req.headers.get('cookie') || ''
  
  const res = await fetch(`${baseUrl}${path}${url.search}`, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'cookie': cookie,
    },
    body: req.method !== 'GET' ? await req.text() : undefined,
  })
  
  return NextResponse.json(await res.json())
}

export async function GET(req: Request) {
  return proxyRequest(req, '/api/trocas')
}

export async function PUT(req: Request) {
  return proxyRequest(req, '/api/trocas')
}