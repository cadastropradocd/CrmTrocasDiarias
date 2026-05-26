export type Role = 'ADMIN' | 'USER'

export interface Database {
  public: {
    Tables: {
      Departamento: {
        Row: {
          id: number
          nome: string
          meta: number
          ativo: boolean
        }
        Insert: {
          id?: number
          nome: string
          meta: number
          ativo?: boolean
        }
        Update: {
          id?: number
          nome?: string
          meta?: number
          ativo?: boolean
        }
      }
      Registro: {
        Row: {
          id: number
          categoria: string
          realizado: number
          meta: number
          trocaDiaId: number
          departamentoId: number | null
        }
        Insert: {
          id?: number
          categoria: string
          realizado: number
          meta: number
          trocaDiaId: number
          departamentoId?: number | null
        }
        Update: {
          id?: number
          categoria?: string
          realizado?: number
          meta?: number
          trocaDiaId?: number
          departamentoId?: number | null
        }
      }
      TrocaDia: {
        Row: {
          id: number
          data: string
          createdAt: string
        }
        Insert: {
          id?: number
          data: string
          createdAt?: string
        }
        Update: {
          id?: number
          data?: string
          createdAt?: string
        }
      }
      User: {
        Row: {
          id: number
          username: string
          password: string
          name: string
          role: Role
          createdAt: string
        }
        Insert: {
          id?: number
          username: string
          password: string
          name: string
          role?: Role
          createdAt?: string
        }
        Update: {
          id?: number
          username?: string
          password?: string
          name?: string
          role?: Role
          createdAt?: string
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
