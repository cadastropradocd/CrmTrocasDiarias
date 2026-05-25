import { redirect } from 'next/navigation'
import { getSession } from '@/app/lib/session'

export default async function AdminHome() {
  const session = await getSession()

  if (!session || session.role !== 'ADMIN') {
    redirect('/login')
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Painel Admin</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Bem-vindo, {session.name}
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginTop: '2rem'
      }}>
        <a href="/admin/departamentos" style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.5rem',
          textDecoration: 'none',
          color: 'inherit',
          transition: 'transform 0.15s, border-color 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.borderColor = 'var(--accent)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.borderColor = 'var(--border)'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📦</div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            Departamentos
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Gerenciar categorias e metas
          </p>
        </a>

        <a href="/admin/trocas" style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.5rem',
          textDecoration: 'none',
          color: 'inherit',
          transition: 'transform 0.15s, border-color 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.borderColor = 'var(--accent)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.borderColor = 'var(--border)'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📊</div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            Trocas Diárias
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Ver histórico completo
          </p>
        </a>
      </div>
    </div>
  )
}