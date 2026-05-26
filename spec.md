# SPEC.md - Relatório de Trocas Diário (v4.0)

## 1. Visão Geral do Projeto

**Nome:** TrocasDiarias CRM
**Objetivo:** Sistema web para registro diário de trocas/comercial, com painel admin para gerenciamento de departamentos e controle de acesso baseado em roles.

**Público-alvo:**
- **Administrador (`cadastro`):** Lança e corrige dados diários, gerencia departamentos.
- **Equipe Comercial (`comercial`):** Apenas visualiza o histórico e métricas.

**Diferencial:** Histórico permanente de dados por dia (snapshots), permitindo análise temporal sem perda de informações.

---

## 2. Stack Tecnológica

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Next.js | 16.2.6 | Framework (App Router) |
| React | 19.2.4 | Biblioteca UI |
| TypeScript | 5 | Tipagem |
| @supabase/supabase-js | 2.x | Cliente Supabase (banco de dados) |
| bcryptjs | 3.0.3 | Hash de senhas |
| jsonwebtoken | 9.0.3 | Autenticação JWT |
| Chart.js | 4.5.1 | Gráficos |

**Estilização:** CSS com CSS Variables (Dark Theme) — sem Tailwind, sem frameworks CSS.

---

## 3. Estrutura de Arquivos

```
TrocasDiarias/
├── app/
│   ├── admin/
│   │   ├── departamentos/page.tsx    # CRUD de departamentos
│   │   ├── historico/
│   │   │   ├── page.tsx             # Lista histórico (admin)
│   │   │   └── [data]/page.tsx      # Detalhes histórico (admin)
│   │   ├── trocas/page.tsx          # Dashboard de trocas editável
│   │   ├── layout.tsx               # Layout com AdminSidebar
│   │   ├── layout.module.css
│   │   └── page.tsx                 # Home painel admin
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts       # POST: Autenticação
│   │   │   ├── logout/route.ts      # POST: Logout
│   │   │   └── register/route.ts    # POST: Criar usuário (ADMIN)
│   │   ├── trocas/route.ts          # GET/PUT: Registros por data
│   │   ├── trocas/historico/route.ts     # GET: Lista datas
│   │   ├── trocas/historico/[data]/route.ts # GET: Detalhes por data
│   │   ├── departamentos/route.ts   # CRUD departamentos
│   │   └── users/route.ts           # CRUD usuários (ADMIN)
│   ├── comercial/
│   │   ├── historico/
│   │   │   ├── page.tsx             # Lista histórico (comercial)
│   │   │   └── [data]/page.tsx      # Detalhes histórico (comercial)
│   │   ├── layout.tsx               # Layout com ComercialSidebar
│   │   ├── layout.module.css
│   │   └── page.tsx                 # Redirect para /comercial/historico
│   ├── components/
│   │   ├── Dashboard.tsx            # Componente principal (props: editable, readonlyBanner)
│   │   ├── DateSelector.tsx         # Seletor de data
│   │   ├── AdminSidebar.tsx         # Sidebar admin (hover-to-expand)
│   │   ├── ComercialSidebar.tsx     # Sidebar comercial
│   │   ├── HistoricoList.tsx        # Lista de histórico
│   │   ├── HistoricoDetalhes.tsx    # Detalhes de uma data
│   │   ├── TrocasDiarias.tsx        # Widget de trocas (usado em admin/trocas)
│   │   └── Toast.tsx                # Notificações
│   ├── lib/
│   │   ├── auth.ts                  # JWT & Bcrypt
│   │   ├── session.ts               # getSession() (server-side)
│   │   ├── supabase.ts              # Cliente Supabase
│   │   ├── db/                      # Helpers de banco (usados pela API)
│   │   │   ├── index.ts             # Export agregado
│   │   │   ├── usuarios.ts          # getUserByUsername, createUser, etc
│   │   │   ├── departamentos.ts      # CRUD departamentos
│   │   │   ├── trocas.ts           # getTrocaDiaByDate, getOrCreateTrocaDia
│   │   │   └── registros.ts         # getRegistrosByTrocaDiaId, upsertRegistros
│   │   ├── database.types.ts        # Tipos gerados do Supabase
│   │   └── types.ts                 # Role, helpers
│   ├── login/page.tsx               # Página de login
│   ├── globals.css                  # CSS global (dark theme)
│   ├── layout.tsx                   # RootLayout
│   └── page.tsx                     # Dashboard readonly (/)
├── middleware.ts                     # Auth middleware (renomeado de proxy.ts)
├── scripts/
│   └── migrate_via_api.js           # Script de migração
├── supabase-init.sql                # Schema inicial
├── package.json
├── tsconfig.json
├── next.config.ts
└── spec.md                          # Este documento
```

---

## 4. Modelo de Dados (Supabase/PostgreSQL)

### 4.1 Tabela `usuarios`

| Coluna | Tipo | Descrição |
|--------|------|---------|
| id | serial | PK |
| username | varchar(50) | Unique |
| password | varchar(255) | Hash bcrypt |
| name | varchar(100) | Nome completo |
| role | role | ADMIN ou USER |
| created_at | timestamp | Default now() |

### 4.2 Enum Role

```sql
CREATE TYPE role AS ENUM ('ADMIN', 'USER');
```

### 4.3 Tabela `trocas_dias`

Cada dia de registro é um `trocas_dias` único. Permite histórico permanente.

| Coluna | Tipo | Descrição |
|--------|------|---------|
| id | serial | PK |
| data | date | Unique (YYYY-MM-DD) |
| created_at | timestamp | Default now() |

### 4.4 Tabela `registros`

Registros pertencem a um `trocas_dias`. Um departamento pode ter apenas um registro por dia.

| Coluna | Tipo | Descrição |
|--------|------|---------|
| id | serial | PK |
| troca_dia_id | int | FK → trocas_dias.id |
| categoria | varchar(100) | Nome do departamento |
| realizado | float | Valor realizado no dia |
| meta | float | Meta do dia |

**Unique constraint:** `(troca_dia_id, categoria)`

### 4.5 Tabela `departamentos`

Departamentos/categorias gerenciados pelo admin. Cada departamento tem uma meta padrão.

| Coluna | Tipo | Descrição |
|--------|------|---------|
| id | serial | PK |
| nome | varchar(100) | Unique, uppercase |
| meta | float | Meta diária padrão |
| ativo | boolean | Pode ser desativado |
| created_at | timestamp | Default now() |
| updated_at | timestamp | Auto-update |

---

## 5. Usuários do Sistema

| Username | Senha | Role | Descrição |
|----------|-------|------|-----------|
| `cadastro` | `160922` | ADMIN | Admin do sistema |
| `comercial` | `123456` | USER | Equipe comercial |

---

## 6. Endpoints da API

### 6.1 Autenticação

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/api/auth/login` | Login com username/password | Público |
| POST | `/api/auth/logout` | Logout (limpa cookie) | Logado |
| POST | `/api/auth/register` | Criar usuário | ADMIN |

### 6.2 Trocas

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/api/trocas?date=YYYY-MM-DD` | Retorna registros de um dia | Logado |
| PUT | `/api/trocas` | Salva/Atualiza registros de um dia | ADMIN |
| GET | `/api/trocas/historico` | Lista todas as datas | Logado |
| GET | `/api/trocas/historico/[data]` | Detalhes de uma data | Logado |

### 6.3 Departamentos

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/api/departamentos` | Lista todos departamentos | Logado |
| POST | `/api/departamentos` | Cria novo departamento | ADMIN |
| PUT | `/api/departamentos?id=X` | Atualiza departamento | ADMIN |
| PATCH | `/api/departamentos?id=X` | Toggle ativo | ADMIN |
| DELETE | `/api/departamentos?id=X` | Remove departamento | ADMIN |

### 6.4 Usuários

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/api/users` | Lista todos usuários | ADMIN |
| POST | `/api/users` | Cria usuário | ADMIN |
| DELETE | `/api/users?id=X` | Remove usuário | ADMIN |

---

## 7. Autenticação e Autorização

### 7.1 Fluxo de Login

1. Usuário envia `POST /api/auth/login` com `{ username, password }`
2. Backend valida credenciais via bcrypt
3. Gera JWT com payload `{ username, name, role }`
4. Define cookie `session` (HttpOnly, secure em prod)
5. Retorna `{ token, name, role }` para o cliente

### 7.2 Proteção de Rotas

**Middleware (`middleware.ts`):**
- `/login` → Se logado, redirect para `/admin` ou `/comercial`
- `/admin/*` → Apenas ADMIN
- `/comercial/*` → Qualquer usuário logado
- `/` → Qualquer usuário logado

### 7.3 Fluxo de Redirect Pós-Login

| Role | Redirect |
|------|----------|
| ADMIN | `/admin` |
| USER | `/comercial` → `/comercial/historico` |

---

## 8. Páginas do Sistema

### 8.1 Login (`/login`)

- Formulário com username e password
- Erros mostrados via Toast
- Redireciona para `/admin` ou `/comercial` após login

### 8.2 Dashboard Público (`/`)

- Componente `<Dashboard editable={false} readonlyBanner={true} />`
- Visualização de dados (somente leitura)
- DateSelector para navegar entre datas
- Gráfico Chart.js

### 8.3 Painel Admin (`/admin`)

- Home do painel admin com cards
- Protegido: apenas ADMIN acessa
- AdminSidebar com navegação

### 8.4 Trocas Admin (`/admin/trocas`)

- Componente `<TrocasDiarias />`
- Dashboard editável
- Admin pode navegar e editar qualquer data

### 8.5 Departamentos Admin (`/admin/departamentos`)

- CRUD completo de departamentos
- Tabela com colunas: Nome, Meta, Status, Ações

### 8.6 Histórico Admin (`/admin/historico`)

- Lista todas as datas disponíveis
- Redirect para detalhes ao clicar

### 8.7 Área Comercial (`/comercial`)

- `/comercial` → redirect para `/comercial/historico`
- `/comercial/historico` → `<HistoricoList isComercial={true} />`
- `/comercial/historico/[data]` → `<HistoricoDetalhes isComercial={true} />`
- ComercialSidebar

---

## 9-sidebars

### 9.1 AdminSidebar

- **Oculta por padrão:** Largura de 60px
- **Expande no hover:** Largura de 220px
- **Posição:** Fixed na esquerda, altura 100vh

| Label | Rota |
|-------|------|
| Home | `/admin` |
| Departamentos | `/admin/departamentos` |
| Trocas Diárias | `/admin/trocas` |
| Sair | `/login` |

### 9.2 ComercialSidebar

- Mesma estrutura visual da AdminSidebar
- Itens específicos para área comercial

| Label | Rota |
|-------|------|
| Histórico | `/comercial/historico` |
| Sair | `/login` |

---

## 10. Componentes Principais

### 10.1 Dashboard.tsx

Props:
- `editable?: boolean` — Habilita edição
- `readonlyBanner?: boolean` — Mostra banner "Modo somente leitura"

Funcionalidades:
- DateSelector integrado
- Tabela de registros com inputs (se editable)
- Gráfico de barras (Chart.js)
- Botão Salvar (se editable)
- Toast para feedback

### 10.2 TrocasDiarias.tsx

Page wrapper para `/admin/trocas`. Renderiza `<Dashboard editable={true} />`.

### 10.3 HistoricoList.tsx

Props:
- `isComercial?: boolean` — Ajusta caminhos de navegação

Lista datas disponíveis com totales.

### 10.4 HistoricoDetalhes.tsx

Props:
- `isComercial?: boolean` — Ajusta caminhos de navegação

Mostra detalhes de uma data específica.

### 10.5 DateSelector.tsx

Props:
- `selectedDate: string` — Data atual (YYYY-MM-DD)
- `onDateChange: (date: string) => void`

Dropdown com datas do histórico.

---

## 11. Regras de Negócio

### 11.1 Data Handling

-Todas as datasnormalizadas para UTC midnight
- DateSelector usa getters locais para exibir no fuso de São Paulo

### 11.2 Histórico

- Dados nunca são sobrescritos, apenas novos dias são criados
- TrocaDia é único por data
- Registro é único por (trocaDiaId, categoria)

---

## 12. Variáveis de Ambiente

### 12.1 Locais (`.env` / `.env.local`)

```env
JWT_SECRET=[string-secreta-minimo-32-chars]
NEXT_PUBLIC_SUPABASE_URL=[url-supabase]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[chave-anonima]
```

### 12.2 Vercel

Mesmas variáveis configuradas no dashboard da Vercel.

---

## 13. Scripts npm

| Script | Descrição |
|--------|----------|
| `dev` | Inicia servidor de desenvolvimento |
| `build` | `next build` |
| `start` | Inicia servidor de produção |
| `lint` | ESLint |

---

## 14. URLs do Projeto

| Ambiente | URL |
|----------|-----|
| Local | `http://localhost:3000` |
| Produção | `https://trocas-diarias.vercel.app` |

---

## 15. Bugs / Correções Recentes

| Data | Descrição |
|------|----------|
| 26/05/2026 | Login redirecionava ADMIN para `/` (home) em vez de `/admin` |
| 26/05/2026 | Área comercial não tinha redirect para `/comercial/historico` |

---

*Última atualização: 2026-05-26*
