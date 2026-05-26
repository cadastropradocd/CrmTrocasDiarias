'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro desconhecido')
        return
      }

      sessionStorage.setItem('token', data.token)
      sessionStorage.setItem('userName', data.name)
      sessionStorage.setItem('userRole', data.role)

      if (data.role === 'ADMIN') {
        router.push('/admin')
      } else {
        router.push('/comercial')
      }
    } catch {
      setError('Erro de conexão com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-page)',
      padding: '1rem',
      fontFamily: 'var(--font)',
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '2rem',
        width: '100%',
        maxWidth: 400,
        boxShadow: 'var(--shadow-card)',
      }}>
        <h1 style={{
          fontSize: '1.25rem',
          fontWeight: 900,
          color: 'var(--text-heading)',
          textAlign: 'center',
          marginBottom: '0.25rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          RELATÓRIO DE TROCAS
        </h1>
        <p style={{
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          textAlign: 'center',
          marginBottom: '1.5rem',
        }}>
          Faça login para continuar
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            type="text"
            placeholder="Usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={inputStyle}
          />

          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 600 }}>{error}</p>
          )}

          <button type="submit" disabled={loading} className="action-btn" style={{
            width: '100%',
            justifyContent: 'center',
            padding: '0.7rem',
            fontSize: '0.85rem',
          }}>
            {loading ? 'Aguarde...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.75rem',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  background: 'var(--bg-page)',
  color: 'var(--text)',
  fontSize: '0.9rem',
  fontFamily: 'var(--font)',
  outline: 'none',
}