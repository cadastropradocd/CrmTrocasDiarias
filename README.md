# CRM Trocas Diárias

Sistema de CRM para registro de trocas diárias por departamento.

## Stack

- **Next.js 16** - Framework full-stack
- **Cloudflare Pages** - Hosting na edge
- **D1** - Banco SQLite serverless
- **@opennextjs/cloudflare** - Build adapter

## Setup

### 1. Criar D1

```bash
wrangler d1 create trocas-diarias
```

Atualizar `wrangler.toml` com o `database_id` retornado:

```toml
[[d1_databases]]
binding = "DB"
database_name = "trocas-diarias"
database_id = "YOUR_ACTUAL_DB_ID"
```

### 2. Aplicar Schema

```bash
wrangler d1 execute trocas-diarias --remote --file=./schema.sql
```

### 3. Seed (opcional)

```bash
wrangler d1 execute trocas-diarias --remote --file=./seed.sql
```

### 4. Configurar Variáveis

No dashboard do Cloudflare Pages → Settings → Environment Variables:

```
JWT_SECRET = seu-secret-aqui
```

### 5. Deploy

```bash
npm run build
npm run deploy
```

## Desenvolvimento Local

```bash
npm run dev
```

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Dev server em localhost:3000 |
| `npm run build` | Build com open-next |
| `npm run deploy` | Deploy para Cloudflare Pages |

## Estrutura

```
/
├── app/                    # Next.js app router
│   ├── api/               # API routes (Edge)
│   ├── admin/            # Páginas admin
│   ├── dashboard/        # Dashboard
│   ├── historico/         # Histórico
│   ├── login/            # Login
│   └── components/       # Componentes React
├── public/               # Assets estáticos
├── schema.sql            # Schema D1
├── seed.sql             # Dados iniciais
├── wrangler.toml        # Config Cloudflare
└── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| GET | /api/trocas | Get today's data |
| PUT | /api/trocas | Update trocas (admin) |
| GET | /api/trocas/historico | Get history |
| GET | /api/users | List users (admin) |
| POST | /api/users | Create user (admin) |
| DELETE | /api/users?id=X | Delete user (admin) |
| GET | /api/departamentos | List departamentos (admin) |
| POST | /api/departamentos | Create departamento (admin) |
| PUT | /api/departamentos?id=X | Update departamento (admin) |
| PATCH | /api/departamentos?id=X | Toggle ativo (admin) |
| DELETE | /api/departamentos?id=X | Delete departamento (admin) |