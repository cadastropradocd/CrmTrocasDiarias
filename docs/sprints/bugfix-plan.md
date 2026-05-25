# Plano de Correção Cirúrgica — Sprint Bugfix

## 🎯 Objetivo

Corrigir APENAS os bugs críticos e altos identificados na auditoria, sem alterar funcionalidades existentes ou adicionar features novas.

---

## 📋 Ordem de Execução (Dependências)

```
FASE 1: Segurança Core (antes de tudo)
├── 1.1 Corrigir JWT payload (email → username)
├── 1.2 Corrigir validação do login
└── 1.3 Adicionar logout funcional

FASE 2: Loop Infinito (crítico)
└── 2.1 Remover redirect 401 do Dashboard

FASE 3: Validação de Dados
├── 3.1 Validar PUT /api/dados
└── 3.2 Corrigir DateSelector token null

FASE 4: Documentação
└── 4.1 Atualizar spec.md
```

---

## 🔧 FASE 1: Segurança Core

### 1.1 — Corrigir JWT Payload (`app/lib/auth.ts`)

**Problema:** JWT guarda `email` mas o modelo User só tem `username`.

**Mudança:** 1 linha no type e 1 na chamada.

```typescript
// ANTES (linha 20):
export function signToken(payload: { email: string; name: string; role: Role }): string {

// DEPOIS:
export function signToken(payload: { username: string; name: string; role: Role }): string {
```

```typescript
// ANTES (linha 28):
export function verifyToken(token: string): { email: string; name: string; role: Role } | null {

// DEPOIS:
export function verifyToken(token: string): { username: string; name: string; role: Role } | null {
```

**Arquivos afetados:**
- `app/lib/auth.ts` — tipo do payload
- `app/api/login/route.ts` — chamada (mudar `email: user.username` → `username: user.username`)

---

### 1.2 — Corrigir Validação do Login (`app/api/login/route.ts`)

**Problema:** JSON parse sem try-catch pode crashar; sem validação de tipos.

**Mudança:** Adicionar try-catch e validação de tipos.

```typescript
// ANTES:
const raw = await req.text()
const { username, password } = JSON.parse(raw)
if (!username || !password) { ... }

// DEPOIS:
let username: string, password: string
try {
  const body = await req.json()
  if (typeof body.username !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }
  username = body.username.trim()
  password = body.password
} catch {
  return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
}
if (!username || !password) { ... }
```

**Arquivos afetados:** `app/api/login/route.ts`

---

### 1.3 — Adicionar Logout Funcional (`app/api/logout/route.ts` + Dashboard.tsx)

**Problema:** `logout()` só limpa sessionStorage, não limpa cookie HttpOnly.

**Mudança:**
1. Criar `app/api/logout/route.ts`:
```typescript
import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
```

2. Modificar `Dashboard.tsx:327-330`:
```typescript
// ANTES:
function logout() {
  sessionStorage.clear()
  router.push('/login')
}

// DEPOIS:
async function logout() {
  try {
    await fetch('/api/logout', { method: 'POST' })
  } catch { /* ignore */ }
  sessionStorage.clear()
  router.push('/login')
}
```

**Arquivos afetados:**
- `app/api/logout/route.ts` (NOVA)
- `app/components/Dashboard.tsx` (função logout)

---

## 🔧 FASE 2: Loop Infinito

### 2.1 — Remover Redirect 401 do Dashboard (`app/components/Dashboard.tsx:126-130`)

**Problema:** Bloco que faz `router.push('/login')` ao receber 401 causa loop.

**Mudança:** Remover todo o bloco `if (res.status === 401)`.

```typescript
// ANTES (linha 125-130):
if (!res.ok) {
  if (res.status === 401) {
    sessionStorage.clear()
    showToast('Sessão expirada. Faça login novamente.', 'warning')
    router.push('/login')
    return
  }
  showToast('Erro ao carregar dados', 'error')
  setLoading(false)
  return
}

// DEPOIS:
if (!res.ok) {
  showToast('Erro ao carregar dados', 'error')
  setLoading(false)
  return
}
```

**Nota:** O `proxy.ts` já cuida do redirect no servidor. Cliente não precisa fazer nada.

**Arquivos afetados:** `app/components/Dashboard.tsx`

---

## 🔧 FASE 3: Validação de Dados

### 3.1 — Validar PUT /api/dados (`app/api/dados/route.ts`)

**Problema:** Typecast sem validação pode receber dados ruins.

**Mudança:** Adicionar validação rigorosa.

```typescript
// ANTES (linha 72-77):
const body = await req.json()
const { date, registros } = body as { date: string; registros: Array<{ categoria: string; realizado: number; meta: number }> }
if (!date || !registros || !Array.isArray(registros)) { ... }

// DEPOIS:
const body = await req.json()

// Validação de date
if (typeof body.date !== 'string' || !body.date) {
  return NextResponse.json({ error: 'Data inválida' }, { status: 400 })
}
const dateObj = new Date(body.date + 'T00:00:00Z')
if (isNaN(dateObj.getTime())) {
  return NextResponse.json({ error: 'Data inválida' }, { status: 400 })
}

// Validação de registros
if (!Array.isArray(body.registros)) {
  return NextResponse.json({ error: 'Registros inválidos' }, { status: 400 })
}
const registros = body.registros.map((r: unknown) => {
  if (typeof r !== 'object' || r === null) {
    throw new Error('Registro inválido')
  }
  const reg = r as Record<string, unknown>
  if (typeof reg.categoria !== 'string' || !reg.categoria) {
    throw new Error('Categoria inválida')
  }
  if (typeof reg.realizado !== 'number' || !Number.isFinite(reg.realizado)) {
    throw new Error('Realizado inválido')
  }
  if (typeof reg.meta !== 'number' || !Number.isFinite(reg.meta)) {
    throw new Error('Meta inválida')
  }
  return {
    categoria: reg.categoria,
    realizado: reg.realizado,
    meta: reg.meta,
  }
})
```

**Arquivos afetados:** `app/api/dados/route.ts`

---

### 3.2 — Corrigir DateSelector Token Null (`app/components/DateSelector.tsx`)

**Problema:** `token` pode ser null, causando fetch sem autenticação.

**Mudança:** Garantir que o fetch sempre use autenticação válida.

```typescript
// ANTES (linha 44-62):
useEffect(() => {
  async function fetchDates() {
    try {
      const res = await fetch('/api/historico', {
        headers: { Authorization: `Bearer ${token}` },
      })
      ...
    }
  }
  if (token) {
    fetchDates()
  }
}, [token])

// DEPOIS:
useEffect(() => {
  async function fetchDates() {
    try {
      // Sem headers - usa cookie automaticamente via getSession()
      const res = await fetch('/api/historico')
      if (!res.ok) return
      const data = await res.json()
      setDates(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }
  fetchDates()
}, [])
```

**Nota:** `getSession()` no server já lê o cookie HttpOnly. Não precisa de Bearer token.

**Arquivos afetados:** `app/components/DateSelector.tsx`

---

## 🔧 FASE 4: Documentação

### 4.1 — Atualizar spec.md (`docs/spec.md`)

**Problema:** Modelo de dados está incorreto (falta TrocaDia, mostra Registro direto).

**Mudança:** Atualizar seção 4 (Modelo de Dados) para refletir o schema.prisma real.

**Conteúdo correto:**
```markdown
4. Modelo de Dados (Prisma Schema)

model User {
  id       Int      @id @default(autoincrement())
  username String   @unique
  password String
  name     String
  role     Role     @default(USER)
  createdAt DateTime @default(now())
}

model TrocaDia {
  id        Int       @id @default(autoincrement())
  data      DateTime  @unique  // Apenas a data importa
  createdAt DateTime  @default(now())
  registros Registro[]
}

model Registro {
  id          Int      @id @default(autoincrement())
  categoria   String
  realizado   Float
  meta        Float
  trocaDiaId  Int
  trocaDia    TrocaDia @relation(fields: [trocaDiaId], references: [id], onDelete: Cascade)

  @@unique([trocaDiaId, categoria])
}

enum Role {
  ADMIN
  USER
}
```

**Arquivos afetados:** `docs/spec.md` (seção 4)

---

## 📊 Resumo de Arquivos Modificados

| # | Arquivo | Tipo | Mudanças |
|---|---------|------|----------|
| 1 | `app/lib/auth.ts` | MODIFY | 2 linhas (tipos) |
| 2 | `app/api/login/route.ts` | MODIFY | ~10 linhas (validação) |
| 3 | `app/api/logout/route.ts` | CREATE | ~15 linhas |
| 4 | `app/components/Dashboard.tsx` | MODIFY | 2 blocos (~5 linhas) |
| 5 | `app/api/dados/route.ts` | MODIFY | ~20 linhas (validação) |
| 6 | `app/components/DateSelector.tsx` | MODIFY | ~10 linhas (fetch) |
| 7 | `docs/spec.md` | MODIFY | seção 4 (~30 linhas) |

**Total: 6 arquivos modificados + 1 criado = 7 arquivos**

---

## ⚠️ Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Breaking auth existente | baixa | crítico | Testar login antes e depois com usuário seed |
| Quebrar fetch de dados | média | alto | Testar Dashboard com data existente |
| Regression em CSS | nenhuma | baixa | Não modifica CSS |

---

## ✅ Checklist de Verificação

Após cada mudança:

- [ ] Login com `cadastro/160922` funciona
- [ ] Login com `comercial/123456` funciona
- [ ] Logout limpa cookie E sessionStorage
- [ ] Dashboard carrega dados sem loop
- [ ] Admin pode salvar novo registro
- [ ] User não pode acessar /admin
- [ ] DateSelector mostra datas disponíveis

---

## 🧪 Teste Mínimo Obrigatório

```bash
# 1. Limpar cookies e sessionStorage
# 2. Ir para /admin
# 3. Deveria redirecionar para /login
# 4. Login como cadastro/160922
# 5. Acessar /admin com dados
# 6. Logout
# 7. Ir para /admin - deveria redirecionar para /login (cookie limpo)
# 8. Ir para / - deveria redirecionar para /login (sem cookie)
```

---

**Estimativa:** ~1-2 horas de trabalho, risco baixo se seguir ordem.