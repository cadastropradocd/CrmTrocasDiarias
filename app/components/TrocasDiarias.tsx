'use client'

import { useEffect, useState } from 'react'
import Toast, { showToast } from '@/app/components/Toast'

interface Departamento {
  id: number
  nome: string
  meta: number
  realizado: number
}

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

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00')
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const ano = d.getFullYear()
  return `${dia}/${mes}/${ano}`
}

function todayString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

type SortCol = 'nome' | 'realizado' | 'meta' | 'diferenca' | 'status'
type SortDir = 'asc' | 'desc'

function formatDiferenca(valor: number): string {
  const f = formatBRL(Math.abs(valor))
  const seta = valor > 0 ? '↑' : valor < 0 ? '↓' : '→'
  return `${f} ${seta}`
}

function formatStatusPct(realizado: number, meta: number): string {
  if (meta === 0) return '0,00% →'
  const v = ((realizado - meta) / meta) * 100
  const pct = `${Math.abs(v).toFixed(2).replace('.', ',')}%`
  if (v > 0) return `${pct} ↑`
  if (v < 0) return `${pct} ↓`
  return `${pct} →`
}

function classeStatus(diferenca: number): string {
  return diferenca > 0 ? 'status-negativo' : 'status-positivo'
}

export default function TrocasDiarias() {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState('')
  const [sortCol, setSortCol] = useState<SortCol | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dados')
        if (!res.ok) {
          showToast('Erro ao carregar dados', 'error')
          setLoading(false)
          return
        }
        const result = await res.json()
        setData(result.data)
        setDepartamentos(result.departamentos || [])
      } catch {
        showToast('Erro de conexão com o servidor', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  function handleEditChange(id: number, campo: 'realizado', value: string) {
    const novoValor = parseNumBR(value)
    setDepartamentos((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [campo]: novoValor ?? d[campo] } : d))
    )
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/dados', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registros: departamentos.map((d) => ({
            nome: d.nome,
            realizado: d.realizado || 0,
            meta: d.meta || 0,
          })),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        showToast(err.error || 'Erro ao salvar dados', 'error')
        return
      }

      showToast('Dados salvos com sucesso!', 'success')
    } catch {
      showToast('Erro de conexão', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function logout() {
    try {
      await fetch('/api/logout', { method: 'POST' })
    } catch { /* ignore */ }
    window.location.href = '/login'
  }

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
      nome: 'DEPARTAMENTO',
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

  const sorted = [...departamentos]
  if (sortCol) {
    const factor = sortDir === 'asc' ? 1 : -1
    sorted.sort((a, b) => {
      let va: number | string = 0
      let vb: number | string = 0
      if (sortCol === 'nome') { va = a.nome; vb = b.nome }
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

  const totalRealizado = departamentos.reduce((a, d) => a + (d.realizado || 0), 0)
  const totalMeta = departamentos.reduce((a, d) => a + d.meta, 0)
  const totalDiferenca = totalRealizado - totalMeta

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
        <header className="header" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          <div className="header-left">
            <h1>TROCAS DIÁRIAS</h1>
            <span className="date-badge">{formatDateDisplay(data)}</span>
          </div>
          <div className="header-right">
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
            <strong className="kpi-value">{formatDiferenca(totalDiferenca)}</strong>
            <span className="kpi-subvalue">
              {totalMeta === 0 ? '0,00% na meta total' : `${Math.abs(((totalRealizado - totalMeta) / totalMeta) * 100).toFixed(2).replace('.', ',')}% ${totalDiferenca >= 0 ? 'acima' : 'abaixo'} da meta total`}
            </span>
          </article>
        </section>

        <section className="content-grid">
          <div className="card">
            <h2>LANÇAMENTOS DE HOJE</h2>
            <div className="table-wrap">
              <table aria-label="Tabela de trocas por departamento">
                <thead>
                  <tr>
                    <th className={`sortable ${sortCol === 'nome' ? 'sort-active' : ''}`} onClick={() => handleSort('nome')}>{sortLabel('nome')}</th>
                    <th className={`sortable ${sortCol === 'realizado' ? 'sort-active' : ''}`} onClick={() => handleSort('realizado')}>{sortLabel('realizado')}</th>
                    <th className={`sortable ${sortCol === 'meta' ? 'sort-active' : ''}`} onClick={() => handleSort('meta')}>{sortLabel('meta')}</th>
                    <th className={`sortable ${sortCol === 'diferenca' ? 'sort-active' : ''}`} onClick={() => handleSort('diferenca')}>{sortLabel('diferenca')}</th>
                    <th className={`sortable ${sortCol === 'status' ? 'sort-active' : ''}`} onClick={() => handleSort('status')}>{sortLabel('status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((d) => {
                    const diferenca = (d.realizado || 0) - d.meta
                    return (
                      <tr key={d.id}>
                        <td style={{ fontWeight: 600 }}>{d.nome}</td>
                        <td>
                          <input
                            className="cell-input"
                            type="text"
                            defaultValue={formatNumEdicao(d.realizado)}
                            onChange={(e) => handleEditChange(d.id, 'realizado', e.target.value)}
                            onFocus={(e) => e.target.select()}
                          />
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatNumEdicao(d.meta)}</td>
                        <td className={classeStatus(diferenca)}>{formatDiferenca(diferenca)}</td>
                        <td className={classeStatus(diferenca)}>{formatStatusPct(d.realizado || 0, d.meta)}</td>
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