'use client'

import { useState, useEffect } from 'react'

interface Departamento {
  id: number
  nome: string
  meta: number
  ativo: boolean
  createdAt: string
}

export default function DepartamentosPage() {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDepto, setEditingDepto] = useState<Departamento | null>(null)
  const [formData, setFormData] = useState({ nome: '', meta: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDepartamentos()
  }, [])

  async function fetchDepartamentos() {
    try {
      const res = await fetch('/api/departamentos')
      if (res.ok) {
        const data = await res.json()
        setDepartamentos(data)
      }
    } catch (err) {
      console.error('Failed to fetch:', err)
    } finally {
      setLoading(false)
    }
  }

  function openAddModal() {
    setEditingDepto(null)
    setFormData({ nome: '', meta: '' })
    setError('')
    setModalOpen(true)
  }

  function openEditModal(depto: Departamento) {
    setEditingDepto(depto)
    setFormData({ nome: depto.nome, meta: depto.meta.toString() })
    setError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingDepto(null)
    setFormData({ nome: '', meta: '' })
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!formData.nome.trim()) {
      setError('Nome é obrigatório')
      return
    }

    const metaValue = parseFloat(formData.meta)
    if (isNaN(metaValue) || metaValue < 0) {
      setError('Meta deve ser um número válido')
      return
    }

    setSaving(true)

    try {
      const url = editingDepto
        ? `/api/departamentos?id=${editingDepto.id}`
        : '/api/departamentos'
      const method = editingDepto ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: formData.nome.trim(), meta: metaValue }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao salvar')
      }

      closeModal()
      fetchDepartamentos()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number, nome: string) {
    if (!confirm(`Excluir "${nome}"? Esta ação não pode ser desfeita.`)) return

    try {
      const res = await fetch(`/api/departamentos?id=${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao excluir')
      }
      fetchDepartamentos()
    } catch (err: any) {
      alert(err.message)
    }
  }

  async function handleToggleAtivo(depto: Departamento) {
    try {
      const res = await fetch(`/api/departamentos?id=${depto.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !depto.ativo }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar')
      fetchDepartamentos()
    } catch (err) {
      alert('Erro ao atualizar status')
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Departamentos</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Gerencie categorias e metas para o relatório de trocas
          </p>
        </div>
        <button
          onClick={openAddModal}
          style={{
            background: 'var(--accent)',
            color: '#000',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          + Novo Departamento
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Carregando...
        </div>
      ) : departamentos.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Nenhum departamento cadastrado
          </p>
          <button onClick={openAddModal} style={{
            background: 'var(--accent)',
            color: '#000',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
          }}>
            Criar primeiro departamento
          </button>
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                <th style={thStyle}>Nome</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Meta</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {departamentos.map((depto) => (
                <tr key={depto.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 500 }}>{depto.nome}</span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>
                    {depto.meta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button
                      onClick={() => handleToggleAtivo(depto)}
                      style={{
                        background: depto.ativo ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 85, 85, 0.2)',
                        color: depto.ativo ? '#4ade80' : '#f87171',
                        border: 'none',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {depto.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button
                      onClick={() => openEditModal(depto)}
                      style={actionBtnStyle}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(depto.id, depto.nome)}
                      style={{ ...actionBtnStyle, marginLeft: '0.5rem' }}
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div style={overlayStyle} onClick={closeModal}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>
              {editingDepto ? 'Editar Departamento' : 'Novo Departamento'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Nome</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: AÇOUGUE"
                  style={inputStyle}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Meta Diária</label>
                <input
                  type="number"
                  value={formData.meta}
                  onChange={(e) => setFormData({ ...formData, meta: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  style={inputStyle}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Valor padrão para novos registros
                </span>
              </div>

              {error && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.875rem'
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border)',
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: 'var(--accent)',
                    color: '#000',
                    border: 'none',
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '1rem',
  textAlign: 'left' as const,
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
}

const tdStyle: React.CSSProperties = {
  padding: '1rem',
  fontSize: '0.9rem',
}

const actionBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: '0.5rem',
  cursor: 'pointer',
  fontSize: '1rem',
  borderRadius: '6px',
  transition: 'background 0.15s',
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed' as const,
  inset: 0,
  background: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(4px)',
}

const modalStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: '16px',
  padding: '2rem',
  width: '100%',
  maxWidth: '400px',
  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.5rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--text-muted)',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text)',
  fontSize: '1rem',
  outline: 'none',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box' as const,
}