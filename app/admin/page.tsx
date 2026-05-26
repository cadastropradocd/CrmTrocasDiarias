import { redirect } from 'next/navigation'
import { getSession } from '@/app/lib/session'

function AdminCard({ href, emoji, title, description }: {
  href: string
  emoji: string
  title: string
  description: string
}) {
  return (
    <a href={href} style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '1.5rem',
      textDecoration: 'none',
      color: 'inherit',
      transition: 'transform 0.15s, border-color 0.15s',
    }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{emoji}</div>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
        {title}
      </h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        {description}
      </p>
    </a>
  )
}

export default async function AdminHome() {
  let session = null
  try {
    session = await getSession()
  } catch (error) {
    console.error('[admin] Error getting session:', error)
    redirect('/login')
  }

  if (!session || session.role !== 'ADMIN') {
    redirect('/login')
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
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
        <AdminCard
          href="/dashboard"
          emoji="📊"
          title="Trocas Diárias"
          description="Lançar trocas do dia"
        />
        <AdminCard
          href="/historico"
          emoji="📋"
          title="Histórico"
          description="Ver registros anteriores"
        />
        <AdminCard
          href="/departamentos"
          emoji="📦"
          title="Departamentos"
          description="Gerenciar categorias e metas"
        />
      </div>
    </div>
  )
}
