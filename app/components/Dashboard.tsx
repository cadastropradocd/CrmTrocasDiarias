'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Chart, registerables } from 'chart.js'
import Toast, { showToast } from '@/app/components/Toast'
import DateSelector from '@/app/components/DateSelector'

Chart.register(...registerables)

interface Registro {
  id: number
  categoria: string
  realizado: number
  meta: number
}

interface TrocaDia {
  id: number
  data: string
  createdAt: string
  registros: Registro[]
}

type SortCol = 'setor' | 'realizado' | 'meta' | 'diferenca' | 'status'
type SortDir = 'asc' | 'desc'

function formatBRL(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatNumEdicao(valor: number): string {
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parseNumBR(texto: string): number | null {
  const t = String(texto || '').trim()
  if (!t) return null
  const limpo = t.replace(/\s/g, '').replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '')
  if (!limpo || limpo === '-' || limpo === '.' || limpo === '-.') return null
  const num = Number(limpo)
  return Number.isFinite(num) ? num : null
}

function formatDiferenca(valor: number): string {
  const f = formatBRL(Math.abs(valor))
  const seta = valor > 0 ? '↑' : valor < 0 ? '↓' : '→'
  return `${f} <span class="diferenca-seta">${seta}</span>`
}

function formatStatusPct(realizado: number, meta: number): string {
  if (meta === 0) return '0,00% →'
  const v = ((realizado - meta) / meta) * 100
  const pct = `${Math.abs(v).toFixed(2).replace('.', ',')}%`
  if (v > 0) return `${pct} ↑`
  if (v < 0) return `${pct} ↓`
  return `${pct} →`
}

function formatStatusMetaTotal(totalRealizado: number, totalMeta: number): string {
  if (totalMeta === 0) return '0,00% na meta total'
  const v = ((totalRealizado - totalMeta) / totalMeta) * 100
  const pct = `${Math.abs(v).toFixed(2).replace('.', ',')}%`
  if (v > 0) return `${pct} acima da meta total`
  if (v < 0) return `${pct} abaixo da meta total`
  return `${pct} na meta total`
}

function classeStatus(diferenca: number): string {
  return diferenca > 0 ? 'status-negativo' : 'status-positivo'
}

function obterDestaques(registros: Registro[]) {
  if (!registros.length) return { melhor: null, critico: null }
  const comPct = registros.map((r, i) => ({
    ...r,
    pct: r.meta > 0 ? (r.realizado - r.meta) / r.meta : 0,
    index: i,
  }))
  const melhor = comPct.reduce((a, b) => (a.pct < b.pct || (a.pct === b.pct && a.index < b.index) ? a : b))
  const critico = comPct.reduce((a, b) => (a.pct > b.pct || (a.pct === b.pct && a.index < b.index) ? a : b))
  return { melhor: melhor.categoria, critico: critico.categoria }
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr)
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const ano = d.getFullYear()
  return `${dia}/${mes}/${ano}`
}

function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface DashboardProps {
  editable?: boolean
  readonlyBanner?: boolean
}

export default function Dashboard({ editable = false, readonlyBanner = false }: DashboardProps) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [currentData, setCurrentData] = useState<TrocaDia | null>(null)
  const [registros, setRegistros] = useState<Registro[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sortCol, setSortCol] = useState<SortCol | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)
  const headerRef = useRef<HTMLElement>(null)

  const fetchData = useCallback(async (date: string) => {
    try {
      const res = await fetch(`/api/trocas?date=${date}`)
      if (!res.ok) {
        showToast('Erro ao carregar dados', 'error')
        setLoading(false)
        return
      }
      const data: TrocaDia | null = await res.json()
      setCurrentData(data)
      setRegistros(data?.registros ?? [])
    } catch {
      showToast('Erro de conexão com o servidor', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    fetchData(selectedDate)
  }, [selectedDate, fetchData])

  useEffect(() => {
    if (!chartRef.current || registros.length === 0) return
    if (chartInstance.current) {
      chartInstance.current.data.labels = registros.map((r) => r.categoria)
      chartInstance.current.data.datasets[0].data = registros.map((r) => r.realizado)
      chartInstance.current.data.datasets[1].data = registros.map((r) => r.meta)
      chartInstance.current.update()
      return
    }
    const ctx = chartRef.current.getContext('2d')
    if (!ctx) return
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: registros.map((r) => r.categoria),
        datasets: [
          {
            label: 'Realizado',
            data: registros.map((r) => r.realizado),
            backgroundColor: '#3b82f6',
            borderColor: '#1d4ed8',
            borderWidth: 2,
            borderRadius: 4,
            barPercentage: 0.65,
            categoryPercentage: 0.7,
          },
          {
            label: 'Meta',
            data: registros.map((r) => r.meta),
            backgroundColor: 'rgba(251, 191, 36, 0.6)',
            borderColor: 'rgba(251, 191, 36, 0.8)',
            borderWidth: 2,
            borderRadius: 4,
            barPercentage: 0.65,
            categoryPercentage: 0.7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              color: '#94a3b8',
              font: { weight: 700, size: 10 },
              boxWidth: 12,
              boxHeight: 12,
              padding: 12,
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 8,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${formatBRL(ctx.raw as number)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: { color: '#94a3b8', font: { weight: 600, size: 9 }, maxRotation: 30 },
            border: { display: false },
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: { color: '#94a3b8', font: { weight: 600, size: 9 }, callback: (v) => formatBRL(v as number) },
            border: { display: false },
          },
        },
      },
    })
  }, [registros])

  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        header.classList.toggle('header-scrolled', entry.boundingClientRect.top < 0)
      },
      { rootMargin: '-1px 0px 0px 0px', threshold: 0 }
    )
    observer.observe(header)
    return () => observer.disconnect()
  }, [])

  const totalRealizado = registros.reduce((a, r) => a + r.realizado, 0)
  const totalMeta = registros.reduce((a, r) => a + r.meta, 0)
  const totalDiferenca = totalRealizado - totalMeta

  const sorted = [...registros]
  if (sortCol) {
    const factor = sortDir === 'asc' ? 1 : -1
    sorted.sort((a, b) => {
      let va: number | string = 0
      let vb: number | string = 0
      if (sortCol === 'setor') { va = a.categoria; vb = b.categoria }
      if (sortCol === 'realizado') { va = a.realizado; vb = b.realizado }
      if (sortCol === 'meta') { va = a.meta; vb = b.meta }
      if (sortCol === 'diferenca') { va = a.realizado - a.meta; vb = b.realizado - b.meta }
      if (sortCol === 'status') {
        va = a.meta === 0 ? 0 : ((a.realizado - a.meta) / a.meta) * 100
        vb = b.meta === 0 ? 0 : ((b.realizado - b.meta) / b.meta) * 100
      }
      return va < vb ? -1 * factor : va > vb ? 1 * factor : 0
    })
  }

  const destaques = obterDestaques(registros)

  function handleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  function sortLabel(col: SortCol): string {
    const labels: Record<SortCol, string> = {
      setor: 'SETOR',
      realizado: 'REALIZADO',
      meta: 'META',
      diferenca: 'DIFERENÇA',
      status: 'STATUS',
    }
    const base = labels[col]
    const ativa = col === sortCol
    const suf = ativa ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''
    return `${base}${suf}`
  }

  function handleEditChange(categoria: string, campo: 'realizado' | 'meta', value: string) {
    const novoValor = parseNumBR(value)
    setRegistros((prev) =>
      prev.map((r) => (r.categoria === categoria ? { ...r, [campo]: novoValor ?? r[campo] } : r))
    )
  }

  async function handleSave() {
    if (!editable) return
    setSaving(true)
    try {
      const res = await fetch('/api/trocas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, registros }),
      })
      if (!res.ok) {
        showToast('Erro ao salvar dados', 'error')
        return
      }
      const updated: TrocaDia = await res.json()
      setCurrentData(updated)
      showToast('Dados salvos com sucesso!', 'success')
      setTimeout(() => fetchData(selectedDate), 500)
    } catch {
      showToast('Erro de conexão', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch { /* ignore */ }
    sessionStorage.clear()
    router.push('/login')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-muted)' }}>
        Carregando...
      </div>
    )
  }

  return (
    <>
      <Toast />
      <main className="dashboard">
        <header className="header" ref={headerRef} style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          <div className="header-left">
            <h1>RELATÓRIO DE TROCAS DIÁRIO</h1>
            <span className="date-badge">{formatDateDisplay(selectedDate)}</span>
            <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
            {readonlyBanner && (
              <span style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.3rem 0.6rem',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                👁 Somente leitura
              </span>
            )}
          </div>
          <div className="header-right">
            {editable && (
              <button
                className="action-btn"
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: saving ? 'rgba(251,191,36,0.5)' : 'var(--accent)',
                  color: 'var(--bg)',
                  fontWeight: 700,
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Salvando...' : '💾 Salvar'}
              </button>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {typeof window !== 'undefined' ? sessionStorage.getItem('userName') : ''}
            </span>
            <button className="action-btn" onClick={logout} style={{ background: 'transparent', border: '1px solid var(--border-light)' }}>Sair</button>
          </div>
        </header>

        <section className="kpis" aria-label="Indicadores gerais">
          <article className="kpi-card">
            <span className="kpi-label">TOTAL REALIZADO</span>
            <strong className="kpi-value">{formatBRL(totalRealizado)}</strong>
          </article>
          <article className="kpi-card">
            <span className="kpi-label">META TOTAL</span>
            <strong className="kpi-value">{formatBRL(totalMeta)}</strong>
          </article>
          <article className={`kpi-card ${totalDiferenca > 0 ? 'estado-critico' : 'estado-bom'}`}>
            <span className="kpi-label">DIFERENÇA TOTAL</span>
            <strong className="kpi-value" dangerouslySetInnerHTML={{ __html: formatDiferenca(totalDiferenca) }} />
            <span className="kpi-subvalue">{formatStatusMetaTotal(totalRealizado, totalMeta)}</span>
          </article>
        </section>

        <section className="content-grid">
          <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
            <h2>REALIZADO VS META</h2>
            <div style={{ position: 'relative', width: '100%', height: 220, maxHeight: 250 }}>
              <canvas ref={chartRef} style={{ width: '100% !important', height: '100% !important' }} />
            </div>
          </div>
        </section>

        <section className="content-grid">
          <div className="card">
            <h2>DETALHAMENTO POR SETOR</h2>
            {!currentData && !loading && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem 0' }}>
                Nenhum registro para esta data. Selecione outra data ou salve novos dados.
              </p>
            )}
            <div className="table-wrap">
              <table aria-label="Tabela de trocas por categoria">
                <thead>
                  <tr>
                    <th className={`sortable ${sortCol === 'setor' ? 'sort-active' : ''}`} onClick={() => handleSort('setor')}>{sortLabel('setor')}</th>
                    <th className={`sortable ${sortCol === 'realizado' ? 'sort-active' : ''}`} onClick={() => handleSort('realizado')}>{sortLabel('realizado')}</th>
                    <th className={`sortable ${sortCol === 'meta' ? 'sort-active' : ''}`} onClick={() => handleSort('meta')}>{sortLabel('meta')}</th>
                    <th className={`sortable ${sortCol === 'diferenca' ? 'sort-active' : ''}`} onClick={() => handleSort('diferenca')}>{sortLabel('diferenca')}</th>
                    <th className={`sortable ${sortCol === 'status' ? 'sort-active' : ''}`} onClick={() => handleSort('status')}>{sortLabel('status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r) => {
                    const diferenca = r.realizado - r.meta
                    return (
                      <tr key={r.id}>
                        <td>
                          <div className="setor-cell">
                            <span>{r.categoria}</span>
                            {r.categoria === destaques.melhor && <span className="setor-badge badge-melhor">MELHOR</span>}
                            {r.categoria === destaques.critico && <span className="setor-badge badge-critico">CRÍTICO</span>}
                          </div>
                        </td>
                        {editable ? (
                          <>
                            <td>
                              <input
                                className="cell-input"
                                type="text"
                                defaultValue={formatNumEdicao(r.realizado)}
                                onChange={(e) => handleEditChange(r.categoria, 'realizado', e.target.value)}
                                onFocus={(e) => e.target.select()}
                              />
                            </td>
                            <td>
                              <input
                                className="cell-input"
                                type="text"
                                defaultValue={formatNumEdicao(r.meta)}
                                onChange={(e) => handleEditChange(r.categoria, 'meta', e.target.value)}
                                onFocus={(e) => e.target.select()}
                              />
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatNumEdicao(r.realizado)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatNumEdicao(r.meta)}</td>
                          </>
                        )}
                        <td className={classeStatus(diferenca)} dangerouslySetInnerHTML={{ __html: formatDiferenca(diferenca) }} />
                        <td className={classeStatus(diferenca)}>{formatStatusPct(r.realizado, r.meta)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}