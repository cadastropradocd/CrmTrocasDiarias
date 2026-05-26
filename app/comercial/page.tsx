'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ComercialPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/comercial/historico')
  }, [router])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      color: 'var(--text-muted)',
    }}>
      Carregando...
    </div>
  )
}
