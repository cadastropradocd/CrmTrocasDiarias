import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function proxyRequest(req: Request, path: string) {
  const baseUrl = new URL(req.url).origin
  const method = req.method
  const url = new URL(req.url)
  
  // Forward request with cookies
  const res = await fetch(`${baseUrl}${path}${url.search}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'cookie': req.headers.get('cookie') || '',
    },
    body: method !== 'GET' ? await req.text() : undefined,
  })
  
  const data = await res.json()
  return NextResponse.json(data)
}

export async function GET(req: Request) {
  return proxyRequest(req, '/api/departamentos')
}

export async function POST(req: Request) {
  return proxyRequest(req, '/api/departamentos')
}

export async function PUT(req: Request) {
  return proxyRequest(req, '/api/departamentos')
}

export async function PATCH(req: Request) {
  return proxyRequest(req, '/api/departamentos')
}

export async function DELETE(req: Request) {
  return proxyRequest(req, '/api/departamentos')
}