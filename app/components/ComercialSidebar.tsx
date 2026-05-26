'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/comercial', icon: '📊' },
  { label: 'Histórico', href: '/comercial/historico', icon: '📋' },
]

export default function ComercialSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch { /* ignore */ }
    sessionStorage.clear()
    router.push('/login')
  }

  return (
    <div
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        width: isOpen ? '200px' : '60px',
        background: 'var(--bg-header)',
        borderRight: '1px solid var(--border)',
        transition: 'width 0.2s ease',
        zIndex: 200,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: '1rem',
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '1.5rem',
        padding: '0.5rem',
      }}>
        <div style={{
          width: '40px',
          height: '6px',
          background: isOpen ? 'transparent' : 'var(--brand)',
          borderRadius: '3px',
          transition: 'background 0.2s',
        }} />
      </div>

      <nav style={{ flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.9rem 1rem',
                color: isActive ? 'var(--brand)' : 'var(--text-muted)',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: isActive ? 700 : 500,
                borderLeft: isActive ? '3px solid var(--brand)' : '3px solid transparent',
                background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                  e.currentTarget.style.color = 'var(--text)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-muted)'
                }
              }}
            >
              <span style={{ fontSize: '1.2rem', minWidth: '24px', textAlign: 'center' }}>
                {item.icon}
              </span>
              <span style={{
                opacity: isOpen ? 1 : 0,
                transition: 'opacity 0.15s ease',
              }}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      <button
        onClick={handleLogout}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.9rem 1rem',
          color: 'var(--text-muted)',
          background: 'transparent',
          border: 'none',
          borderLeft: '3px solid transparent',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontFamily: 'inherit',
          width: '100%',
          textAlign: 'left',
          transition: 'all 0.15s ease',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
          e.currentTarget.style.color = 'var(--danger)'
          e.currentTarget.style.borderLeftColor = 'var(--danger)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--text-muted)'
          e.currentTarget.style.borderLeftColor = 'transparent'
        }}
      >
        <span style={{ fontSize: '1.2rem', minWidth: '24px', textAlign: 'center' }}>🚪</span>
        <span style={{
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.15s ease',
        }}>Sair</span>
      </button>

      <div style={{
        padding: '1rem',
        borderTop: '1px solid var(--border)',
        textAlign: 'center',
        opacity: isOpen ? 0.7 : 0,
        transition: 'opacity 0.15s ease',
      }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Comercial
        </span>
      </div>
    </div>
  )
}
