'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Toast, { showToast } from '@/app/components/Toast'

interface Registro {
  categoria: string
  realizado: number
  meta: number
}

interface DetalhesData {
  data: string
  registros: Registro[]
  totalRealizado: number
  totalMeta: number
  diferenca: number
}

function formatBRL(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatNumEdicao(valor: number): string {
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00')
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const ano = d.getFullYear()
  return `${dia}/${mes}/${ano}`
}

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

interface Props {
  data: string
}

export default function HistoricoDetalhes({ data }: Props) {
  const router = useRouter()
  const [detalhes, setDetalhes] = useState<DetalhesData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/trocas/historico/${data}`)
        if (!res.ok) {
          if (res.status === 404) {
            showToast('Nenhum registro para esta data', 'error')
            router.push('/historico')
            return
          }
          showToast('Erro ao carregar detalhes', 'error')
          setLoading(false)
          return
        }
        const result = await res.json()
        setDetalhes(result)
      } catch {
        showToast('Erro de conexão com o servidor', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [data, router])

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch { /* ignore */ }
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-muted)' }}>
        Carregando...
      </div>
    )
  }

  if (!detalhes) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-muted)' }}>
        Nenhum dado encontrado
      </div>
    )
  }

  return (
    <>
      <Toast />
      <main className="dashboard">
        <header className="header" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          <div className="header-left">
            <h1>DETALHES - {formatDateDisplay(data)}</h1>
          </div>
          <div className="header-right">
            <button
              className="action-btn"
              onClick={() => router.push('/historico')}
              style={{ background: 'transparent', border: '1px solid var(--border-light)' }}
            >
              ← Voltar
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
            <strong className="kpi-value">{formatBRL(detalhes.totalRealizado)}</strong>
          </article>
          <article className="kpi-card">
            <span className="kpi-label">TOTAL META</span>
            <strong className="kpi-value">{formatBRL(detalhes.totalMeta)}</strong>
          </article>
          <article className={`kpi-card ${detalhes.diferenca > 0 ? 'estado-critico' : 'estado-bom'}`}>
            <span className="kpi-label">DIFERENÇA TOTAL</span>
            <strong className="kpi-value">{formatDiferenca(detalhes.diferenca)}</strong>
            <span className="kpi-subvalue">
              {detalhes.totalMeta === 0 ? '0,00% na meta total' : `${Math.abs(((detalhes.totalRealizado - detalhes.totalMeta) / detalhes.totalMeta) * 100).toFixed(2).replace('.', ',')}% ${detalhes.diferenca >= 0 ? 'acima' : 'abaixo'} da meta total`}
            </span>
          </article>
        </section>

        <section className="content-grid">
          <div className="card">
            <h2>REGISTROS DO DIA</h2>
            <div className="table-wrap">
              <table aria-label="Tabela de detalhes">
                <thead>
                  <tr>
                    <th>DEPARTAMENTO</th>
                    <th style={{ textAlign: 'right' }}>REALIZADO</th>
                    <th style={{ textAlign: 'right' }}>META</th>
                    <th style={{ textAlign: 'right' }}>DIFERENÇA</th>
                    <th style={{ textAlign: 'right' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {detalhes.registros.map((r, i) => {
                    const diferenca = r.realizado - r.meta
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{r.categoria}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatNumEdicao(r.realizado)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatNumEdicao(r.meta)}</td>
                        <td className={classeStatus(diferenca)} style={{ textAlign: 'right' }}>{formatDiferenca(diferenca)}</td>
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
