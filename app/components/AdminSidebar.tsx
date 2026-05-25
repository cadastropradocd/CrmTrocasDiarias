'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/admin', icon: '🏠' },
  { label: 'Departamentos', href: '/admin/departamentos', icon: '📦' },
  { label: 'Trocas Diárias', href: '/admin/trocas', icon: '📊' },
  { label: 'Sair', href: '/login', icon: '🚪' },
]

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        width: isOpen ? '220px' : '60px',
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
      {/* Toggle indicator */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '1.5rem',
        padding: '0.5rem',
      }}>
        <div style={{
          width: '40px',
          height: '6px',
          background: isOpen ? 'transparent' : 'var(--accent)',
          borderRadius: '3px',
          transition: 'background 0.2s',
        }} />
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href === '/admin' && pathname === '/admin')
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.9rem 1rem',
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: isActive ? 700 : 500,
                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                background: isActive ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
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

      {/* Logo/Brand at bottom */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid var(--border)',
        textAlign: 'center',
        opacity: isOpen ? 0.7 : 0,
        transition: 'opacity 0.15s ease',
      }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          CRM Admin
        </span>
      </div>
    </div>
  )
}