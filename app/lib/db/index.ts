// Legacy database stubs - DB operations will be handled by Edge Functions
// This file exports stubs needed for compilation

export type Role = 'ADMIN' | 'USER'
export type User = { id: number; username: string; password: string; name: string; role: Role }
export type Departamento = { id: number; nome: string; meta: number; ativo: boolean }
export type Registro = { id: number; categoria: string; realizado: number; meta: number; trocaDiaId: number; departamentoId: number | null }
export type TrocaDia = { id: number; data: string }

export async function getAllUsers(): Promise<User[]> { return [] }
export async function createUser(_user: { username: string; password: string; name: string; role?: Role }): Promise<User> { throw new Error('Not implemented') }
export async function deleteUser(_id: number): Promise<void> { throw new Error('Not implemented') }

export async function getAllDepartamentos(): Promise<Departamento[]> { return [] }
export async function getDepartamentosAtivos(): Promise<Departamento[]> { return [] }
export async function getDepartamentoById(_id: number): Promise<Departamento | null> { return null }
export async function createDepartamento(_d: { nome: string; meta: number }): Promise<Departamento> { throw new Error('Not implemented') }
export async function updateDepartamento(_id: number, _u: Partial<Pick<Departamento, 'nome' | 'meta' | 'ativo'>>): Promise<Departamento> { throw new Error('Not implemented') }
export async function deleteDepartamento(_id: number): Promise<void> { throw new Error('Not implemented') }
export async function toggleDepartamentoAtivo(_id: number): Promise<Departamento> { throw new Error('Not implemented') }
export async function existsDepartamentoComNome(_nome: string, _excludeId?: number): Promise<boolean> { return false }

export async function getTrocaDiaByDate(_data: string): Promise<TrocaDia | null> { return null }
export async function getOrCreateTrocaDia(_data: string): Promise<TrocaDia> { throw new Error('Not implemented') }
export async function getTrocasDiasComTotais(): Promise<{ id: number; data: string; totalRealizado: number; totalMeta: number; diferenca: number }[]> { return [] }

export async function getRegistrosByTrocaDiaId(_id: number): Promise<Registro[]> { return [] }
export async function upsertRegistros(_id: number, _regs: Array<{ departamentoId?: number | null; categoria: string; realizado: number; meta: number }>): Promise<Registro[]> { throw new Error('Not implemented') }