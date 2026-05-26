import { supabase } from '../supabase'
import type { Tables } from '../database.types'

export type TrocaDia = Tables<'TrocaDia'>

export async function getTrocaDiaByDate(data: string): Promise<TrocaDia | null> {
  const { data: troca, error } = await supabase
    .from('TrocaDia')
    .select('*')
    .eq('data', data)
    .single()

  if (error) return null
  return troca
}

export async function getTrocaDiaById(id: number): Promise<TrocaDia | null> {
  const { data, error } = await supabase
    .from('TrocaDia')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function getAllTrocasDias(): Promise<TrocaDia[]> {
  const { data, error } = await supabase
    .from('TrocaDia')
    .select('*')
    .order('data', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createTrocaDia(data: string): Promise<TrocaDia> {
  const { data: troca, error } = await supabase
    .from('TrocaDia')
    .insert({ data })
    .select()
    .single()

  if (error) throw error
  return troca
}

export async function getOrCreateTrocaDia(data: string): Promise<TrocaDia> {
  const existing = await getTrocaDiaByDate(data)
  if (existing) return existing
  return createTrocaDia(data)
}

export async function getTrocasDiasComTotais(): Promise<{
  id: number
  data: string
  totalRealizado: number
  totalMeta: number
  diferenca: number
}[]> {
  const trocas = await getAllTrocasDias()
  const result = []

  for (const td of trocas) {
    const { data: registros } = await supabase
      .from('Registro')
      .select('realizado, meta')
      .eq('trocaDiaId', td.id)

    const totalRealizado = registros?.reduce((sum, r) => sum + r.realizado, 0) || 0
    const totalMeta = registros?.reduce((sum, r) => sum + r.meta, 0) || 0

    result.push({
      id: td.id,
      data: td.data,
      totalRealizado,
      totalMeta,
      diferenca: totalRealizado - totalMeta,
    })
  }

  return result
}
