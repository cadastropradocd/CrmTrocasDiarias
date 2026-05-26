import { supabase } from '../supabase'
import type { Tables } from '../database.types'

export type Registro = Tables<'Registro'>

export async function getRegistrosByTrocaDiaId(trocaDiaId: number): Promise<Registro[]> {
  const { data, error } = await supabase
    .from('Registro')
    .select('*')
    .eq('trocaDiaId', trocaDiaId)

  if (error) throw error
  return data || []
}

export async function getRegistrosByData(data: string): Promise<Registro[]> {
  const { data: troca } = await supabase
    .from('TrocaDia')
    .select('id')
    .eq('data', data)
    .single()

  if (!troca) return []

  return getRegistrosByTrocaDiaId(troca.id)
}

export async function createRegistro(registro: {
  trocaDiaId: number
  departamentoId?: number | null
  categoria: string
  realizado: number
  meta: number
}): Promise<Registro> {
  const { data, error } = await supabase
    .from('Registro')
    .insert(registro)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function createRegistros(
  trocaDiaId: number,
  registros: Array<{
    departamentoId?: number | null
    categoria: string
    realizado: number
    meta: number
  }>
): Promise<Registro[]> {
  const records = registros.map((r) => ({
    trocaDiaId,
    departamentoId: r.departamentoId ?? null,
    categoria: r.categoria,
    realizado: r.realizado,
    meta: r.meta,
  }))

  const { data, error } = await supabase
    .from('Registro')
    .insert(records)
    .select()

  if (error) throw error
  return data || []
}

export async function deleteRegistrosByTrocaDiaId(trocaDiaId: number): Promise<void> {
  const { error } = await supabase
    .from('Registro')
    .delete()
    .eq('trocaDiaId', trocaDiaId)

  if (error) throw error
}

export async function upsertRegistros(
  trocaDiaId: number,
  registros: Array<{
    departamentoId?: number | null
    categoria: string
    realizado: number
    meta: number
  }>
): Promise<Registro[]> {
  await deleteRegistrosByTrocaDiaId(trocaDiaId)
  return createRegistros(trocaDiaId, registros)
}
