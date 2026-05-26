import { supabase } from '../supabase'
import type { Tables } from '../database.types'

export type User = Tables<'User'>

export async function getUserByUsername(username: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('User')
    .select('*')
    .eq('username', username)
    .single()

  if (error) return null
  return data
}

export async function getUserById(id: number): Promise<User | null> {
  const { data, error } = await supabase
    .from('User')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('User')
    .select('*')
    .order('username', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createUser(user: {
  username: string
  password: string
  name: string
  role?: 'ADMIN' | 'USER'
}): Promise<User> {
  const { data, error } = await supabase
    .from('User')
    .insert(user)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateUser(
  id: number,
  updates: Partial<Pick<User, 'username' | 'password' | 'name' | 'role'>>
): Promise<User> {
  const { data, error } = await supabase
    .from('User')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteUser(id: number): Promise<void> {
  const { error } = await supabase.from('User').delete().eq('id', id)
  if (error) throw error
}
