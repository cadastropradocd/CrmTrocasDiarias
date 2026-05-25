'use client'

import { useEffect, useState } from 'react'

export interface ToastItem {
  id: string
  mensagem: string
  tipo: 'success' | 'error' | 'warning' | 'info'
}

let toastIdCounter = 0
let addToastFn: ((msg: string, tipo: ToastItem['tipo']) => void) | null = null

export function showToast(mensagem: string, tipo: ToastItem['tipo'] = 'info') {
  addToastFn?.(mensagem, tipo)
}

export default function Toast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    addToastFn = (mensagem, tipo) => {
      const id = String(++toastIdCounter)
      setToasts((prev) => [...prev, { id, mensagem, tipo }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 3000)
    }
    return () => { addToastFn = null }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      pointerEvents: 'none',
    }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            fontWeight: 700,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            border: toast.tipo === 'success' ? '1px solid var(--ok)' : toast.tipo === 'error' ? '1px solid var(--danger)' : toast.tipo === 'warning' ? '1px solid var(--accent)' : '1px solid var(--brand)',
            color: toast.tipo === 'success' ? 'var(--ok)' : toast.tipo === 'error' ? 'var(--danger)' : toast.tipo === 'warning' ? 'var(--accent)' : 'var(--brand)',
            background: 'var(--bg-card)',
            maxWidth: 360,
            lineHeight: 1.3,
          }}
        >
          {toast.mensagem}
        </div>
      ))}
    </div>
  )
}
