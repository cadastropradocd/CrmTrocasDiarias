import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const baseUrl = new URL(req.url).origin
  
  try {
    const body = await req.json()
    // Forward to edge function via absolute URL
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    
    const data = await res.json()
    const response = NextResponse.json(data)
    
    // Pass cookies
    const setCookie = res.headers.get('set-cookie')
    if (setCookie) {
      response.headers.set('set-cookie', setCookie)
    }
    
    return response
  } catch (err) {
    console.error('[login] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}