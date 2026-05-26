import { supabase } from '../supabase'
import type { Tables } from '../database.types'

export type Departamento = Tables<'Departamento'>

export async function getAllDepartamentos(): Promise<Departamento[]> {
  const { data, error } = await supabase
    .from('Departamento')
    .select('*')
    .order('nome', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getDepartamentosAtivos(): Promise<Departamento[]> {
  const { data, error } = await supabase
    .from('Departamento')
    .select('*')
    .eq('ativo', true)
    .order('nome', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getDepartamentoById(id: number): Promise<Departamento | null> {
  const { data, error } = await supabase
    .from('Departamento')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function getDepartamentoByNome(nome: string): Promise<Departamento | null> {
  const { data, error } = await supabase
    .from('Departamento')
    .select('*')
    .eq('nome', nome.toUpperCase())
    .single()

  if (error) return null
  return data
}

export async function createDepartamento(departamento: {
  nome: string
  meta: number
}): Promise<Departamento> {
  const { data, error } = await supabase
    .from('Departamento')
    .insert({ nome: departamento.nome.toUpperCase(), meta: departamento.meta })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateDepartamento(
  id: number,
  updates: Partial<Pick<Departamento, 'nome' | 'meta' | 'ativo'>>
): Promise<Departamento> {
  const { data, error } = await supabase
    .from('Departamento')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function toggleDepartamentoAtivo(id: number): Promise<Departamento> {
  const dept = await getDepartamentoById(id)
  if (!dept) throw new Error('Departamento não encontrado')

  return updateDepartamento(id, { ativo: !dept.ativo })
}

export async function deleteDepartamento(id: number): Promise<void> {
  const { error } = await supabase.from('Departamento').delete().eq('id', id)
  if (error) throw error
}

export async function existsDepartamentoComNome(nome: string, excludeId?: number): Promise<boolean> {
  let query = supabase
    .from('Departamento')
    .select('id')
    .eq('nome', nome.toUpperCase())

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data } = await query.maybeSingle()
  return !!data
}
