# SPEC.md - Relatório de Trocas Diário (v5.0)

## 1. Visão Geral

### 1.1 O que é

**TrocasDiarias CRM** é um sistema web para registro diário de vendas/trocas comerciais de um supermercado, com painel administrativo para gerenciamento e área restrita para a equipe comercial.visualizar métricas e histórico.

### 1.2 Propósito

Permitir que a equipe de **cadastro** lance valores diários de trocas/comercial por departamento (setor), e que a equipe **comercial** acompanhe o desempenho comparado às metas estabelecidas — tudo com histórico permanente que permite análise temporal.

### 1.3 Diferencial

**Histórico permanente com snapshots diários.** Cada dia de operação é preservado como um registro único. Os dados nunca são sobrescritos — ao editar um dia existente, o sistema subtstitui os registros daquele dia específico, mantendo o histórico intacto.

### 1.4 Público-alvo

| Papel | Username | Acesso |
|-------|----------|--------|
| **ADMIN (cadastro)** | `cadastro` | Lança e corrige dados diários, gerencia departamentos e usuários |
| **USER (comercial)** | `comercial` | Apenas visualiza histórico, métricas e detalhes |

---

## 2. Stack Tecnológica

| Tecnologia | Uso |
|------------|-----|
| Next.js 16.2.6 | Framework (App Router) |
| React 19.2.4 | Biblioteca UI |
| TypeScript 5 | Tipagem |
| @supabase/supabase-js 2.x | Cliente Supabase (PostgreSQL) |
| bcryptjs 3.0.3 | Hash de senhas |
| jsonwebtoken 9.0.3 | Autenticação JWT |
| Chart.js 4.5.1 | Gráficos de barras |

**Estilização:** CSS com CSS Variables (Dark Theme). Sem Tailwind, sem frameworks CSS.

---

## 3. Modelo de Dados (Supabase/PostgreSQL)

### 3.1 Enum Role

```sql
CREATE TYPE role AS ENUM ('ADMIN', 'USER');
```

### 3.2 Tabela `User`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | serial | PK |
| username | varchar(50) | Unique, login do usuário |
| password | varchar(255) | Hash bcrypt |
| name | varchar(100) | Nome completo |
| role | role | ADMIN ou USER |
| createdAt | timestamp | Default now() |

### 3.3 Tabela `Departamento`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | serial | PK |
| nome | varchar(100) | Unique, uppercase (ex: "AÇOUGUE", "HORTIFRUTI") |
| meta | float | Meta diária padrão para o departamento |
| ativo | boolean | Departamentos inativos não aparecem na tabela |
| createdAt | timestamp | Default now() |
| updatedAt | timestamp | Auto-update |

### 3.4 Tabela `TrocaDia`

Cada dia de registro é um `TrocaDia` único. Permite histórico permanente.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | serial | PK |
| data | date | Unique (YYYY-MM-DD) |
| createdAt | timestamp | Default now() |

### 3.5 Tabela `Registro`

Registros pertencem a um `TrocaDia`. Cada departamento pode ter apenas um registro por dia.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | serial | PK |
| trocaDiaId | int | FK → TrocaDia.id (onDelete Cascade) |
| departamentoId | int | FK → Departamento.id (nullable) |
| categoria | varchar(100) | Nome do departamento (uppercase) |
| realizado | float | Valor realizado no dia |
| meta | float | Meta do dia |

**Unique constraint:** `(trocaDiaId, categoria)`

---

## 4. Autenticação e Autorização

### 4.1 Fluxo de Login

1. Usuário envia `POST /api/auth/login` com `{ username, password }`
2. Backend busca usuário por username no banco
3. Valida senha com bcrypt.compare
4. Gera JWT com payload `{ username, name, role }`, expira em 24h
5. Define cookie `session` (HttpOnly, Secure em produção, SameSite=Lax)
6. Client salva token no sessionStorage para uso no Authorization header
7. Retorna `{ token, name, role }`

### 4.2 Sessão Server-Side

- **Fonte da verdade:** cookie HttpOnly `session`
- `getSession()` em `lib/session.ts` lê exclusivamente o cookie
- Não depende de sessionStorage ou Authorization header para validação server-side

### 4.3 Proteção de Rotas (proxy.ts)

| Rota | Acesso |
|------|--------|
| `/login` | Público. Se já logado → redirect para `/admin` (ADMIN) ou `/comercial` (USER) |
| `/` | **Qualquer usuário logado** (Dashboard readonly) |
| `/admin/*` | **Apenas ADMIN** |
| `/comercial/*` | **Qualquer usuário logado** (USER ou ADMIN) |

### 4.4 Fluxo de Redirect Pós-Login

| Role | Redirect |
|------|----------|
| ADMIN | `/admin` |
| USER | `/comercial` → `/comercial/historico` |

---

## 5. Estrutura de Rotas

```
/                          → Dashboard readonly (qualquer logado)
/login                     → Login (público)

/admin                     → Home painel admin (ADMIN)
/admin/trocas              → Lançamento do dia atual editável (ADMIN)
/admin/departamentos      → CRUD de departamentos (ADMIN)
/admin/historico           → Lista de datas com totais (ADMIN)
/admin/historico/[data]    → Detalhes de uma data (ADMIN)

/comercial                 → Redirect para /comercial/historico
/comercial/historico       → Lista de datas com totais (USER)
/comercial/historico/[data] → Detalhes de uma data (USER)
```

---

## 6. Funcionalidades por Página + Componentes

### 6.1 Login (`/login`)

- Formulário: username + password
- Autocomplete nativo
- Erros mostrados via Toast (`/api/auth/login` retorna erro)
- Redirect pós-login conforme role (linha 36-40 de `login/page.tsx`)

### 6.2 Home (`/`) — Dashboard Readonly

- `<Dashboard editable={false} readonlyBanner={true} />`
- DateSelector para navegar entre datas do histórico
- Gráfico Chart.js de barras: Realizado vs Meta por setor
- Tabela com ordenação por coluna (setor, realizado, meta, diferença, status)
- Badges "MELHOR" (melhor desempenho % positivo) e "CRÍTICO" (pior)
- KPIs: Total Realizado, Meta Total, Diferença Total (com status %)
- **Não tem botão Salvar** (readonly)

### 6.3 Admin — Home (`/admin`)

- Layout com `AdminSidebar`
- Cards de navegação para seções
- Sidebar expande no hover (60px → 220px)

### 6.4 Admin — Trocas Diárias (`/admin/trocas`)

- Componente `<TrocasDiarias />`
- **Diferente do Dashboard:** Não tem DateSelector, não tem gráfico
- Apenas tabela editável do dia ATUAL
- Inputs para valor Realizado e Meta de cada departamento
- Botão Salvar
- Mostra banner "Modo somente leitura" se readonly=true mas isso não deveria acontecer aqui

### 6.5 Admin — Departamentos (`/admin/departamentos`)

- CRUD completo
- Modal para criar/editar: campos Nome (text) e Meta (number)
- Tabela: Nome, Meta, Status (Ativo/Inativo), Ações
- Toggle ativo/inativo via PATCH
- Confirmação antes de excluir (DELETE)

### 6.6 Admin — Histórico (`/admin/historico`)

- `<HistoricoList isComercial={false} />`
- Lista todas as datas disponíveis ordenadas por data (desc)
- mostraKPIs: Total Realizado, Meta, Diferença
- Botão "Lançar Hoje" → `/admin/trocas`
- Botão "Ver detalhes" → `/admin/historico/[data]`

### 6.7 Admin — Detalhes Histórico (`/admin/historico/[data]`)

- `<HistoricoDetalhes isComercial={false} basePath="/admin/historico" />`
- Mostra data, KPIs, tabela de registros do dia
- Botão voltar

### 6.8 Comercial — Home (`/comercial`)

- `useEffect` com `router.replace('/comercial/historico')`
- Usuário SEMPRE vai para `/comercial/historico`

### 6.9 Comercial — Histórico (`/commercial/historico`)

- `<HistoricoList isComercial={true} />`
- Mesma interface do admin/historico, mas:
  - **Não tem** botão "Lançar Hoje"
  - Usa `ComercialSidebar`

### 6.10 Comercial — Detalhes (`/comercial/historico/[data]`)

- `<HistoricoDetalhes isComercial={true} basePath="/comercial/historico" />`

---

## 7. Componentes Principais

### 7.1 Dashboard.tsx

Props:
- `editable?: boolean` — Habilita edição (default: false)
- `readonlyBanner?: boolean` — Mostra banner "Somente leitura" (default: false)

Funcionalidades:
- DateSelector integrado
- Tabela com ordenação por colunas
- Gráfico de barras Realizado vs Meta (Chart.js)
- Badges MELHOR/CRÍTICO
- Botão Salvar (se editable)
- Toast para feedback

### 7.2 TrocasDiarias.tsx

- Wrapper para `/admin/trocas` — `<Dashboard editable={true} />`
- Não tem DateSelector nem gráfico (diferente do Dashboard completo)

### 7.3 DateSelector.tsx

Props: `selectedDate: string`, `onDateChange: (date: string) => void`

Funcionalidades:
- Dropdown com datas do histórico
- Opção "Hoje" no topo
- Opção "+ Nova data..." com date input customizado
- Carrega datas de `/api/trocas/historico`

### 7.4 HistoricoList.tsx

Props: `isComercial?: boolean` (default: false)

- Lista datas com totales
- Ajusta `basePath` para navegação (/admin/historico ou /comercial/historico)
- Não mostra botão "Lançar Hoje" se `isComercial=true`

### 7.5 HistoricoDetalhes.tsx

Props: `isComercial?: boolean`, `basePath?: string`

- Detalhes de uma data específica
- Tabela deRegistros, KPIs

### 7.6 AdminSidebar.tsx / ComercialSidebar.tsx

- Fixed na esquerda, 100vh
- Largura: 60px collapsed → 220px hover
- ItensAdmin: Home, Departamentos, Trocas Diárias, Histórico, Sair
- ItensComercial: Histórico, Sair

### 7.7 Toast.tsx

- Notificações globais (success, error, warning, info)
- Auto-dismiss, posicionado top-right

---

## 8. Regras de Negócio

### 8.1 Meta vs Realizado

- **Meta:** Valor-alvo diário definido por departamento. Configurada no cadastro do departamento.
- **Realizado:** Valor efetivamente atingido naquele dia.
- **Diferença:** `Realizado - Meta`
  - Positivo → acima da meta (resultado bom, cor verde)
  - Negativo → abaixo da meta (resultado ruim, cor vermelha)
- **Status %:** `((Realizado - Meta) / Meta) * 100`

### 8.2 Salvamento de Dados

Ao salvar um dia:
1. Se `TrocaDia` para aquela data não existe → cria
2. Deleta TODOS os `Registro` daquele dia
3. Recria os registros com os valores atuais (upsert via delete+insert)
4. Isso permite editar任意 valor do dia

### 8.3 Departamentos Ativos/Inativos

- `ativo=true` → aparece na tabela de edição e no histórico
- `ativo=false` → não aparece nas tabelas
- Permite desativar sem perder histórico

### 8.4 Data Handling

- Armazenamento: `YYYY-MM-DD` (UTC date)
- Exibição: `DD/MM/YYYY`
- DateSelector usa getters locais para fuso de São Paulo

---

## 9. Regras de Formatação

### 9.1 Monetary (BRL)

```typescript
function formatBRL(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
// 5267.70 → "R$ 5.267,70"
```

### 9.2 Percentual de Status

```typescript
function formatStatusPct(realizado: number, meta: number): string {
  // Retorna: "10,50% ↑" | "5,25% ↓" | "0,00% →"
}
```

### 9.3 Diferença Visual

```typescript
function formatDiferenca(valor: number): string {
  // Retorna: "R$ 1.267,70 ↑" | "R$ 500,00 ↓" | "R$ 0,00 →"
}
```

### 9.4 Parsing pt-BR

```typescript
function parseNumBR(texto: string): number | null {
  // Aceita "5.267,70", "5267.70", "5267,70" → 5267.70
}
```

---

## 10. Endpoints da API

### 10.1 Autenticação

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/api/auth/login` | Login | Público |
| POST | `/api/auth/logout` | Logout (limpa cookie) | Logado |
| POST | `/api/auth/register` | Criar usuário | **403 — desabilitado** |

### 10.2 Trocas

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/api/trocas?date=YYYY-MM-DD` | Registros do dia | Logado |
| PUT | `/api/trocas` | Salvar registros do dia | **ADMIN** |
| GET | `/api/trocas/historico` | Lista de datas disponíveis | Logado |
| GET | `/api/trocas/historico/[data]` | Detalhes de uma data | Logado |

### 10.3 Departamentos

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/api/departamentos` | Lista todos | **ADMIN** |
| POST | `/api/departamentos` | Cria departamento | **ADMIN** |
| PUT | `/api/departamentos?id=X` | Atualiza | **ADMIN** |
| PATCH | `/api/departamentos?id=X` | Toggle ativo | **ADMIN** |
| DELETE | `/api/departamentos?id=X` | Remove | **ADMIN** |

### 10.4 Usuários

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/api/users` | Lista todos | **ADMIN** |
| POST | `/api/users` | Cria usuário | **ADMIN** |
| DELETE | `/api/users?id=X` | Remove usuário | **ADMIN** |

---

## 11. CSS / Tema

### 11.1 Variáveis (Dark Theme)

```css
--bg-page: #0b1525;           /* Fundo da página */
--bg-card: #151e30;           /* Fundo de cards */
--bg-header: #0f172a;         /* Fundo do header */
--border: #1e3a5f;            /* Bordas */
--border-light: #2d4a6f;      /* Bordas leves */
--text: #f1f5f9;              /* Texto principal */
--text-muted: #94a3b8;        /* Texto secundário */
--text-heading: #ffffff;      /* Títulos */
--brand: #3b82f6;             /* Azul */
--accent: #fbbf24;            /* Amarelo (accent) */
--ok / --status-ok: #10b981;  /* Verde */
--danger / --status-critico: #ef4444; /* Vermelho */
```

### 11.11 Classes de Status

| Classe | Cor | Uso |
|--------|-----|-----|
| `.status-positivo` | Verde (#34d399) | Acima da meta |
| `.status-negativo` | Vermelho (#f87171) | Abaixo da meta |
| `.estado-bom` | Borda verde | Diferença positiva |
| `.estado-critico` | Borda vermelha | Diferença negativa |
| `.badge-melhor` | Verde | Melhor desempenho |
| `.badge-critico` | Vermelho | Pior desempenho |

---

## 12. Usuários do Sistema (Seed)

| Username | Senha | Role | Nome |
|----------|-------|------|------|
| `cadastro` | `160922` | ADMIN | Cadastro |
| `comercial` | `123456` | USER | Equipe Comercial |

---

## 13. URLs

| Ambiente | URL |
|----------|-----|
| Local | `http://localhost:3000` |
| Produção Vercel | `https://trocas-diarias.vercel.app` |

---

## 14. Bugs / Correções Recentes

| Data | Descrição |
|------|-----------|
| 26/05/2026 | Login: usuário ADMIN era redirecionado para `/` (home) em vez de `/admin` |
| 26/05/2026 | `/comercial` não redirecionava automaticamente para `/comercial/historico` |
| 26/05/2026 | Logout: agora limpa corretamente o cookie HttpOnly |

---

*Última atualização: 2026-05-26*
