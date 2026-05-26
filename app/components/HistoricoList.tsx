'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Toast, { showToast } from '@/app/components/Toast'

interface HistoricoItem {
  id: number
  data: string
  totalRealizado: number
  totalMeta: number
  diferenca: number
}

function formatBRL(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00')
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const ano = d.getFullYear()
  return `${dia}/${mes}/${ano}`
}

function formatDateValue(dateStr: string): string {
  return dateStr.split('T')[0]
}

function formatDiferenca(valor: number): string {
  const f = formatBRL(Math.abs(valor))
  const seta = valor > 0 ? '↑' : valor < 0 ? '↓' : '→'
  return `${f} ${seta}`
}

function formatStatusPct(realizado: number, meta: number): string {
  if (meta === 0) return '0,00%'
  const v = ((realizado - meta) / meta) * 100
  const pct = `${Math.abs(v).toFixed(2).replace('.', ',')}%`
  if (v > 0) return `${pct} acima`
  if (v < 0) return `${pct} abaixo`
  return `${pct} na meta`
}

export default function HistoricoList() {
  const router = useRouter()
  const [historico, setHistorico] = useState<HistoricoItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/historico')
        if (!res.ok) {
          showToast('Erro ao carregar histórico', 'error')
          setLoading(false)
          return
        }
        const data = await res.json()
        setHistorico(data)
      } catch {
        showToast('Erro de conexão com o servidor', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  async function handleViewDetails(data: string) {
    router.push(`/admin/historico/${data}`)
  }

  async function logout() {
    try {
      await fetch('/api/logout', { method: 'POST' })
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

  return (
    <>
      <Toast />
      <main className="dashboard">
        <header className="header" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          <div className="header-left">
            <h1>HISTÓRICO DE TROCAS</h1>
          </div>
          <div className="header-right">
            <button
              className="action-btn"
              onClick={() => router.push('/admin/trocas')}
              style={{ background: 'var(--accent)', color: 'var(--bg)', fontWeight: 700 }}
            >
              ➕ Lançar Hoje
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {typeof window !== 'undefined' ? sessionStorage.getItem('userName') : ''}
            </span>
            <button className="action-btn" onClick={logout} style={{ background: 'transparent', border: '1px solid var(--border-light)' }}>Sair</button>
          </div>
        </header>

        <section className="content-grid">
          <div className="card">
            {historico.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>
                Nenhum registro encontrado. Clique em "Lançar Hoje" para começar.
              </p>
            ) : (
              <div className="table-wrap">
                <table aria-label="Tabela de histórico de trocas">
                  <thead>
                    <tr>
                      <th>DATA</th>
                      <th style={{ textAlign: 'right' }}>TOTAL REALIZADO</th>
                      <th style={{ textAlign: 'right' }}>TOTAL META</th>
                      <th style={{ textAlign: 'right' }}>DIFERENÇA</th>
                      <th>STATUS</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {historico.map((item) => {
                      const diferenca = item.totalRealizado - item.totalMeta
                      return (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 700, fontSize: '1.1rem' }}>{formatDateDisplay(item.data)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatBRL(item.totalRealizado)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatBRL(item.totalMeta)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatDiferenca(diferenca)}</td>
                          <td style={{ color: diferenca >= 0 ? 'var(--status-ok)' : 'var(--status-critico)', fontWeight: 600, fontSize: '0.85rem' }}>
                            {formatStatusPct(item.totalRealizado, item.totalMeta)}
                          </td>
                          <td>
                            <button
                              className="action-btn"
                              onClick={() => handleViewDetails(formatDateValue(item.data))}
                              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                            >
                              Ver detalhes
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  )
}