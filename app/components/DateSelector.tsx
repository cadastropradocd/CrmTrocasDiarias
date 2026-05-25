'use client'

import { useEffect, useState } from 'react'

interface DateOption {
  id: number
  data: string
  createdAt: string
}

// Retorna data local no formato YYYY-MM-DD (sem timezone issues)
function getLocalDateString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Converte string ISO "2026-05-25T00:00:00.000Z" para "2026-05-25"
function isoToDateOnly(isoStr: string): string {
  if (!isoStr) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) return isoStr
  const parts = isoStr.split('T')
  return parts[0] || ''
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00')
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const ano = d.getFullYear()
  return `${dia}/${mes}/${ano}`
}

function formatDateValue(dateStr: string): string {
  return isoToDateOnly(dateStr)
}

function isToday(dateStr: string): boolean {
  return formatDateValue(dateStr) === getLocalDateString()
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
        <option value={getLocalDateString()}>
          Hoje ({formatDateDisplay(getLocalDateString())})
        </option>
        {dates
          .filter((d) => d.data !== getLocalDateString())
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