# spec.md - Relatório de Trocas Diário (v2.0)

## 1. Visão Geral do Projeto

**Objetivo:** Sistema web para registro diário de trocas/comercial, com histórico completo, visualização de métricas e controle de acesso baseado em roles.

**Público-alvo:**
- **Administrador** (Você): Lança e corrige dados diários.
- **Equipe Comercial**: Apenas visualiza o histórico e métricas.

**Diferencial:** Histórico permanente de dados por dia (snapshots), permitindo análise temporal sem perda de informações.

## 2. Stack Tecnológica

- **Framework:** Next.js 16.2.6 (App Router), React 19, TypeScript.
- **Estilização:** CSS (Dark Theme nativo) — não usar Tailwind.
- **Banco de Dados:**
  - Dev: SQLite (`file:./dev.db`) via Prisma + `prisma-better-sqlite3`.
  - Prod: PostgreSQL via Supabase.
- **ORM:** Prisma 7.
- **Autenticação:** JWT (`jsonwebtoken`), Hashing (`bcryptjs`), Cookies HttpOnly.
- **Gráficos:** Chart.js 4.
- **UI Components:** Toast customizado.

## 3. Estrutura de Arquivos

```
app/
├── api/
│   ├── login/route.ts        # POST: Autenticação
│   ├── dados/route.ts        # GET: Lista registros por data | PUT: Salva dia
│   └── historico/route.ts    # GET: Lista todas as datas disponíveis
├── components/
│   ├── Dashboard.tsx         # Componente único com props editable/readonlyBanner
│   ├── DateSelector.tsx      # Seletor de data reutilizável
│   └── Toast.tsx             # Notificações
├── lib/
│   ├── auth.ts               # JWT & Bcrypt
│   ├── prisma.ts             # PrismaClient
│   └── session.ts            # getSession()
├── login/page.tsx            # Login
├── admin/page.tsx            # Wrapper: <Dashboard editable={true} />
├── page.tsx                  # Wrapper: <Dashboard editable={false} readonlyBanner={true} />
└── layout.tsx                # RootLayout

proxy.ts                      # Middleware de autenticação

prisma/
├── schema.prisma             # Modelo (TrocaDia + Registro)
└── seed.ts                   # Seed com dados históricos
```

## 4. Modelo de Dados

**Mudança Crítica:** Introdução de `TrocaDia` para permitir histórico. Um registro não é mais sobrescrito; ele pertence a um dia específico.

```prisma
enum Role {
  ADMIN
  USER
}

model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  password  String
  name      String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
}

model TrocaDia {
  id        Int       @id @default(autoincrement())
  data      DateTime  @unique  // Apenas a data importa (2026-05-25 00:00:00)
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
```

## 5. Regras de Negócio e Fluxos

### 5.1 Autenticação (Correção de Bug)

- **Fluxo:** Login via `POST /api/login` → Cookie HttpOnly + Token no cliente.
- **Proteção:**
  - `/admin`: Exige `role=ADMIN`.
  - `/`: Exige qualquer usuário logado.
- **Regra de Ouro:** O servidor (`proxy.ts`) controla o redirecionamento. O cliente NÃO redireciona baseado em erro 401.

### 5.2 Tela Admin (`/admin`)

- Funcionalidade: CRUD de dados diários.
- Fluxo:
  1. Usuário seleciona uma data (Padrão: Hoje).
  2. Sistema busca `TrocaDia` daquela data.
  3. Se existir: Carrega os `Registros` na tabela.
  4. Se não existir: Tabela vazia para preenchimento.
  5. Usuário preenche/edita categorias (Realizado/Meta).
  6. Botão "Salvar":
     - Cria `TrocaDia` se não existir.
     - Upsert nos `Registros`.
- Restrição: Apenas `ADMIN` pode acessar.

### 5.3 Tela Comercial (`/`)

- Funcionalidade: Visualização de Histórico.
- Fluxo:
  1. Usuário vê lista de datas disponíveis (DateSelector).
  2. Seleciona uma data.
  3. Sistema exibe tabela e gráfico somente leitura.
- Restrição: Apenas leitura. Botões de salvar escondidos.

### 5.4 Seed Data

**Usuários:**
- `cadastro` / `160922` (ADMIN)
- `comercial` / `123456` (USER)

**Dados Históricos:**
- Criar 5 `TrocaDia` (dias diferentes: hoje, ontem, anteontem, etc.).
- Em cada dia, inserir os 9 setores com valores variados.

## 6. Endpoints da API

| Método | Rota | Descrição | Permissão |
|--------|------|-----------|-----------|
| POST | `/api/login` | Autentica usuário | Público |
| GET | `/api/historico` | Lista todas as datas (`TrocaDia`) disponíveis | Logado |
| GET | `/api/dados?date=YYYY-MM-DD` | Retorna registros de um dia específico | Logado |
| PUT | `/api/dados` | Salva/Atualiza registros de um dia (`{ date, registros: [] }`) | ADMIN |

## 7. Modelo de Autenticação (Cookie HttpOnly)

### Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                 FONTE DA VERDADE: Cookie HttpOnly            │
│                  (proxy.ts valida no servidor)               │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│  Servidor (proxy.ts)                                        │
│  - Lê cookie 'session'                                      │
│  - Verifica JWT                                              │
│  - Decide: permitir ou redirect /login                       │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│  Cliente (sessionStorage)                                    │
│  - Armazena token para Authorization header                  │
│  - Usa Toast para erros, não redirect                        │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo Correto (Sem Loop)

1. Browser → `GET /admin` (com cookie)
2. `proxy.ts` → valida cookie → permite
3. `Dashboard.tsx` (sem redirect no useEffect)
4. `fetch('/api/dados')` → usa Bearer token do sessionStorage
5. Se 401 → Toast "Sessão expirada" → `router.push('/login')`

## 8. Regras de Implementação

1. **Não usar Tailwind** — continuar com CSS Modules ou inline styles.
2. **Manter componentização atual** — `Dashboard.tsx` único com `editable` prop.
3. **Manter props** — `editable?: boolean`, `readonlyBanner?: boolean`.
4. **DateSelector** — componente para trocar entre dias (date picker).
5. **Todas as datas** em `TrocaDia.data` devem ser normalizadas para meia-noite UTC.
6. **Tipo Role como enum** — `ADMIN` e `USER` (não strings "admin"/"viewer").
7. **Tipagem TypeScript rigorosa** em todos os arquivos.