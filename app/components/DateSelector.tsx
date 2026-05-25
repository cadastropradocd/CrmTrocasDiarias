'use client'

import { useEffect, useState } from 'react'

interface DateOption {
  id: number
  data: string
  createdAt: string
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  const dia = String(d.getUTCDate()).padStart(2, '0')
  const mes = String(d.getUTCMonth() + 1).padStart(2, '0')
  const ano = d.getUTCFullYear()
  return `${dia}/${mes}/${ano}`
}

function formatDateValue(dateStr: string): string {
  return dateStr.split('T')[0]
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00Z')
  const today = new Date()
  return (
    d.getUTCFullYear() === today.getFullYear() &&
    d.getUTCMonth() === today.getMonth() &&
    d.getUTCDate() === today.getUTCDate()
  )
}

interface DateSelectorProps {
  selectedDate: string
  onDateChange: (date: string) => void
}

export default function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const [dates, setDates] = useState<DateOption[]>([])
  const [customDate, setCustomDate] = useState('')

  useEffect(() => {
    async function fetchDates() {
      try {
        // Usa cookie automaticamente via getSession() no server
        const res = await fetch('/api/historico')
        if (!res.ok) return
        const data = await res.json()
        setDates(data)
      } catch {
        // ignore
      }
    }
    fetchDates()
  }, [])

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    if (val === '__custom__') {
      setCustomDate('')
      return
    }
    onDateChange(val)
  }

  function handleCustomSubmit() {
    if (customDate) {
      onDateChange(customDate)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Data:
      </label>
      <select
        value={selectedDate}
        onChange={handleSelectChange}
        style={{
          background: 'var(--bg-card)',
          color: 'var(--text)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.3rem 0.6rem',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <option value={formatDateValue(new Date().toISOString())}>
          Hoje ({formatDateDisplay(new Date().toISOString())})
        </option>
        {dates
          .filter((d) => d.data !== formatDateValue(new Date().toISOString()))
          .map((d) => (
            <option key={d.id} value={formatDateValue(d.data)}>
              {formatDateDisplay(d.data)}
              {isToday(d.data) ? ' (Hoje)' : ''}
            </option>
          ))}
        <option value="__custom__">+ Nova data...</option>
      </select>

      {selectedDate === '__custom__' && (
        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.3rem 0.5rem',
              fontSize: '0.8rem',
              colorScheme: 'dark',
            }}
          />
          <button
            onClick={handleCustomSubmit}
            style={{
              background: 'var(--accent)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '0.3rem 0.6rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Ir
          </button>
        </div>
      )}
    </div>
  )
}