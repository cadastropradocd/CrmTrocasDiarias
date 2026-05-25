# SPEC.md - Relatório de Trocas Diário (v3.0)

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
| Prisma | 7.8.0 | ORM (PostgreSQL/Supabase) |
| PostgreSQL | - | Banco de dados em produção |
| SQLite | - | Banco de dados em desenvolvimento |
| bcryptjs | 3.0.3 | Hash de senhas |
| jsonwebtoken | 9.0.3 | Autenticação JWT |
| Chart.js | 4.5.1 | Gráficos |
| pg | 8.21.0 | Pool de conexões PostgreSQL |

**Estilização:** CSS com CSS Variables (Dark Theme) — sem Tailwind, sem frameworks CSS.

---

## 3. Estrutura de Arquivos

```
TrocasDiarias/
├── app/
│   ├── admin/
│   │   ├── layout.tsx              # Layout com AdminSidebar (protegido ADMIN)
│   │   ├── layout.module.css       # Estilos do layout admin
│   │   ├── page.tsx                # Home do painel admin
│   │   ├── departamentos/
│   │   │   └── page.tsx            # CRUD de departamentos
│   │   └── trocas/
│   │       └── page.tsx            # Dashboard de trocas (editável)
│   ├── api/
│   │   ├── login/route.ts          # POST: Autenticação
│   │   ├── logout/route.ts         # POST: Logout
│   │   ├── dados/route.ts          # GET/PUT: Registros por data
│   │   ├── historico/route.ts     # GET: Lista todas as datas
│   │   └── departamentos/route.ts   # CRUD completo de departamentos
│   ├── components/
│   │   ├── Dashboard.tsx           # Componente principal (props: editable, readonlyBanner)
│   │   ├── DateSelector.tsx        # Seletor de data
│   │   ├── AdminSidebar.tsx        # Sidebar admin (hover-to-expand)
│   │   └── Toast.tsx               # Notificações
│   ├── login/
│   │   └── page.tsx                # Página de login
│   ├── lib/
│   │   ├── prisma.ts               # PrismaClient (PostgreSQL/SQLite)
│   │   ├── auth.ts                 # JWT & Bcrypt
│   │   ├── session.ts              # getSession()
│   │   └── types.ts                # Role, helpers
│   ├── globals.css                 # CSS global (dark theme)
│   ├── layout.tsx                  # RootLayout
│   └── page.tsx                    # Dashboard público (somente leitura)
├── prisma/
│   ├── schema.prisma               # Modelo de dados (PostgreSQL)
│   ├── seed.ts                    # Seed com usuários e dados históricos
│   └── config.ts                   # Configuração do Prisma
├── .env                            # Variaveis locais (dev)
├── package.json
├── tsconfig.json
├── next.config.ts
└── SPEC.md                        # Este documento
```

---

## 4. Modelo de Dados (Prisma Schema)

### 4.1 Enum Role

```prisma
enum Role {
  ADMIN    // Pode editar dados e gerenciar departamentos
  USER     // Apenas visualização
}
```

### 4.2 Model User

```prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  password  String   // Hash bcrypt
  name      String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
}
```

### 4.3 Model TrocaDia

Cada dia de registro é um `TrocaDia` único. Permite histórico permanente.

```prisma
model TrocaDia {
  id        Int       @id @default(autoincrement())
  data      DateTime  @unique  // UTC midnight (YYYY-MM-DD 00:00:00)
  createdAt DateTime  @default(now())
  registros Registro[]
}
```

### 4.4 Model Registro

Registros pertencem a um `TrocaDia`. Um departamento pode ter apenas um registro por dia.

```prisma
model Registro {
  id          Int      @id @default(autoincrement())
  categoria   String   // Nome do departamento
  realizado   Float    // Valor realizado no dia
  meta        Float    // Meta do dia
  trocaDiaId  Int
  trocaDia    TrocaDia @relation(fields: [trocaDiaId], references: [id], onDelete: Cascade)

  @@unique([trocaDiaId, categoria])
}
```

### 4.5 Model Departamento

Departamentos/categorias gerenciados pelo admin. Cada departamento tem uma meta padrão.

```prisma
model Departamento {
  id        Int      @id @default(autoincrement())
  nome      String   @unique  // Uppercase (ex: "AÇOUGUE")
  meta      Float    // Meta diária padrão
  ativo     Boolean  @default(true)  // Pode ser desativado
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

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
| POST | `/api/login` | Login com username/password | Público |
| POST | `/api/logout` | Logout (limpa cookie) | Logado |

### 6.2 Dados

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/api/historico` | Lista todas as datas disponíveis | Logado |
| GET | `/api/dados?date=YYYY-MM-DD` | Retorna registros de um dia | Logado |
| PUT | `/api/dados` | Salva/Atualiza registros de um dia | ADMIN |

### 6.3 Departamentos

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/api/departamentos` | Lista todos departamentos | ADMIN |
| POST | `/api/departamentos` | Cria novo departamento | ADMIN |
| PUT | `/api/departamentos?id=X` | Atualiza departamento | ADMIN |
| PATCH | `/api/departamentos?id=X` | Atualiza campo específico (ativo) | ADMIN |
| DELETE | `/api/departamentos?id=X` | Remove departamento | ADMIN |

---

## 7. Autenticação e Autorização

### 7.1 Fluxo de Login

1. Usuário envia `POST /api/login` com `{ username, password }`
2. Backend valida credenciais via bcrypt
3. Gera JWT com payload `{ username, name, role }`
4. Define cookie `session` (HttpOnly, secure em prod)
5. Retorna `{ token, name, role }` para o cliente

### 7.2 Proteção de Rotas

**Server-side (Next.js Server Components):**
- Páginas admin validam cookie `token` diretamente no servidor
- Redirecionam para `/login` se inválido ou se role != ADMIN

**API Routes:**
- Validam sessão via `getSession()` ou `verifyToken()`
- Retornam 401 se não autorizado

### 7.3 Middleware/Validação

```typescript
// Exemplo de proteção em página admin
const cookieStore = await cookies()
const token = cookieStore.get('token')?.value
if (!token) redirect('/login')
const user = await prisma.user.findUnique({ where: { username: token } })
if (!user || user.role !== 'ADMIN') redirect('/login')
```

---

## 8. Páginas do Sistema

### 8.1 Login (`/login`)

- Formulário com username e password
- Erros mostrados via Toast
- Redireciona para `/` ou `/admin` após login bem-sucedido

### 8.2 Dashboard Público (`/`)

- Componente `<Dashboard editable={false} readonlyBanner={true} />`
- Visualização de dados (somente leitura)
- DateSelector para navegar entre datas
- Gráfico Chart.js

### 8.3 Painel Admin (`/admin`)

- Home do painel com cards de navegação
- Protegido: apenas ADMIN acessa
- Redireciona para `/login` se não autorizado

### 8.4 Departamentos Admin (`/admin/departamentos`)

- CRUD completo de departamentos
- Tabela com colunas: Nome, Meta, Status, Ações
- Modal para criar/editar
- Toggle para ativar/inativar
- Confirmação antes de excluir

### 8.5 Trocas Admin (`/admin/trocas`)

- Componente `<Dashboard editable={true} readonlyBanner={false} />`
- Mesma interface do público, mas com edição habilitada
- Admin pode navegar e editar qualquer data

---

## 9. AdminSidebar (Sidebar Admin)

### 9.1 Comportamento

- **Oculta por padrão:** Largura de 60px (apenas indicador visual)
- **Expande no hover:** Largura de 220px com labels visíveis
- **Posição:** Fixed na esquerda, altura 100vh
- **Z-index:** 200 (acima do conteúdo principal)

### 9.2 Itens de Navegação

| Label | Ícone | Rota | Descrição |
|-------|-------|------|-----------|
| Home | 🏠 | `/admin` | Painel admin |
| Departamentos | 📦 | `/admin/departamentos` | CRUD departamentos |
| Trocas Diárias | 📊 | `/admin/trocas` | Dashboard editável |
| Sair | 🚪 | `/login` | Logout |

### 9.3 Estilos

- Background: `var(--bg-header)`
- Borda direita: `1px solid var(--border)`
- Transição: `width 0.2s ease`
- Indicador ativo: Borda esquerda `3px solid var(--accent)`

---

## 10. Departamentos CRUD

### 10.1 Tela de Listagem

- Header com título e botão "Novo Departamento"
- Tabela com colunas: Nome, Meta, Status (Ativo/Inativo), Ações
- Empty state com mensagem e botão para criar primeiro

### 10.2 Modal de Formulário

- Campos: Nome (text), Meta (number)
- Validação: Nome obrigatório, Meta >= 0
- Botões: Cancelar, Salvar
- Feedback de erro inline

### 10.3 Ações

| Ação | Método | Descrição |
|------|--------|-----------|
| Criar | POST `/api/departamentos` | Novo departamento |
| Editar | PUT `/api/departamentos?id=X` | Atualiza nome e meta |
| Toggle Status | PATCH `/api/departamentos?id=X` | Ativa/Inativa |
| Excluir | DELETE `/api/departamentos?id=X` | Remove departamento |

---

## 11. Configuração de Ambiente

### 11.1 Variáveis Locais (`.env`)

```env
# Desenvolvimento (SQLite)
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-secret-mudar-em-producao"
```

### 11.2 Variáveis Vercel (Environment Variables)

```env
# Produção (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
JWT_SECRET=[STRING-SEGURA-MINIMO-32-CHARS]
```

### 11.3 Prisma Adapter Logic

```typescript
if (DATABASE_URL.startsWith('postgresql://')) {
  // Usa PrismaPg com Pool pg
} else {
  // Usa PrismaBetterSqlite3
}
```

---

## 12. Componentes Principais

### 12.1 Dashboard.tsx

Props:
- `editable?: boolean` — Habilita edição (default: false)
- `readonlyBanner?: boolean` — Mostra banner "Modo somente leitura" (default: false)

Funcionalidades:
- DateSelector integrado
- Tabela de registros com inputs (se editable)
- Gráfico de barras (Chart.js)
- Botão Salvar (se editable)
- Toast para feedback

### 12.2 DateSelector.tsx

Props:
- `selectedDate: string` — Data atual (YYYY-MM-DD)
- `onDateChange: (date: string) => void` — Callback ao selecionar

Funcionalidades:
- Dropdown com datas do histórico
- Opção "Hoje" destacada
- Campo para data customizada

### 12.3 AdminSidebar.tsx

Props: Nenhuma (standalone)

Funcionalidades:
- Hover expand/collapse
- Link ativo com highlight
- Ícones e labels
- Brand no footer

---

## 13. Regras de Negócio

### 13.1 Data Handling

- Todas as datas são normalizadas para UTC midnight
- `toDateOnly()` converte para `Date.UTC(y, m, d, 0, 0, 0, 0)`
- DateSelector usa getters locais (`getDate()`) para exibir corretamente no fuso de São Paulo

### 13.2 Validação

- Campos obrigatórios validados no cliente e servidor
- Tipos verificados antes de processar
- SQL injection prevenida via Prisma ORM

### 13.3 Histórico

- Dados nunca são sobrescritos, apenas novos dias são criados
- TrocaDia é único por data
- Registro é único por (trocaDiaId, categoria)

---

## 14. Scripts npm

| Script | Descrição |
|--------|-----------|
| `dev` | Inicia servidor de desenvolvimento |
| `build` | `prisma generate && next build` |
| `start` | Inicia servidor de produção |
| `postinstall` | Gera Prisma Client |
| `db:migrate` | Executa migrations |
| `db:seed` | Popula banco com dados iniciais |
| `db:setup` | Migrate + seed |

---

## 15. Bugs Conhecidos e Correções

### 15.1 Data Bug (Corrigido)

**Problema:** Badge mostrava data de ontem em vez de hoje.
**Causa:** Uso de getters UTC (`getUTCDate()`) sem considerar fuso horário.
**Solução:** Usar getters locais (`getDate()`) para exibição.

### 15.2 Export Bug (Corrigido)

**Problema:** Build falhava com "Export default doesn't exist".
**Causa:** Import usava `import prisma from` mas prisma.ts usava named export.
**Solução:** Usar `import { prisma } from '@/app/lib/prisma'`.

---

## 16. Estado Atual do Projeto

### 16.1 Funcionalidades Implementadas

✅ Login/logout com JWT
✅ Proteção de rotas (ADMIN/USER)
✅ Dashboard com gráfico
✅ CRUD de dados diários (admin)
✅ CRUD de departamentos (admin)
✅ AdminSidebar com hover
✅ Histórico de datas
✅ Toast notifications
✅ Dark theme CSS

### 16.2 Pendente

⏳ Migração do schema para Supabase (configurar DATABASE_URL no Vercel)
⏳ Deploy em produção

---

## 17. URLs do Projeto

| Ambiente | URL |
|----------|-----|
| Local | `http://localhost:3000` |
| Produção | `https://trocas-diarias.vercel.app` |

---

*Última atualização: 2026-05-25*