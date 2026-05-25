spec.md - Relatório de Trocas Diário
1. Visão Geral do Projeto
Objetivo: Sistema web para registro diário de trocas/comercial, com visualização de métricas (gráficos e tabelas) e controle de acesso baseado em roles (Admin vs. Usuário Padrão). Público-alvo: Equipe comercial e administradores. Status Atual: Projeto em desenvolvimento, com arquitetura definida, mas apresentando bug crítico de "Infinite Loading" na autenticação.

2. Stack Tecnológica
Frontend/Framework: Next.js 16.2.6 (App Router), React 19, TypeScript.
Estilização: Tailwind CSS (padrão Next.js) + Dark Theme nativo.
Banco de Dados:
Dev: SQLite (file:./dev.db) via @prisma/client + prisma-better-sqlite3.
Prod: PostgreSQL via Supabase.
ORM: Prisma 7.
Autenticação: JWT (jsonwebtoken), Hashing (bcryptjs), Cookies HttpOnly.
Gráficos: Chart.js 4.
Notificações: Toast customizado (components/Toast.tsx).
3. Estrutura de Arquivos e Diretórios

/app
├── api/
│   ├── login/route.ts       # POST: Autenticação (username+pass) -> JWT + Cookie
│   ├── dados/route.ts       # GET: Lista registros | PUT: Atualiza (Admin only)
│   └── register/route.ts    # POST: Retorna 403 (Cadastro desabilitado)
├── components/
│   ├── Dashboard.tsx        # Componente principal (lógica de exibição/editação)
│   └── Toast.tsx            # Sistema de notificações
├── lib/
│   ├── auth.ts              # Funções: signToken, verifyToken, comparePassword
│   ├── prisma.ts            # Singleton PrismaClient com adapter SQLite
│   └── session.ts           # getSession() via cookies() (Server Side)
├── login/page.tsx           # Página de Login (Formulário)
├── admin/page.tsx           # Wrapper: <Dashboard editable={true} />
├── page.tsx                 # Wrapper: <Dashboard editable={false} readonlyBanner={true} />
└── layout.tsx               # RootLayout (Dark Theme, Providers)
/proxy.ts                    # Middleware/Proteção de Rotas (Server Side)
/prisma
├── schema.prisma            # Definição de User e Registro
└── seed.ts                  # Script de seed (2 usuários + 9 registros)
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
  data      DateTime  @unique  // Apenas a data importa (sem horário)
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
5. Regras de Negócio e Fluxos
5.1. Autenticação e Sessão
Cookie HttpOnly é a fonte da verdade para sessão server-side.
O cliente mantém token no sessionStorage apenas para APIs que requerem Bearer header.

Login (POST /api/login):

Valida username e password (bcrypt).
Gera JWT.
AÇÃO OBRIGATÓRIA: Define um cookie session com o JWT (HttpOnly, Secure, SameSite=Lax, Max-Age=86400).
Retorna JSON { token: <jwt>, name: <string>, role: <string> } para o cliente.
Cliente (Frontend):

Ao receber o login, salva o token no sessionStorage APENAS para uso em headers de requisição (Authorization: Bearer).
NÃO deve depender do sessionStorage para validar se o usuário está logado na navegação da página (Next.js App Router).
A validação de rota deve ser feita pelo Servidor lendo o Cookie HttpOnly.
Proteção de Rotas (Middleware/Proxy):

/admin: Exige role === 'ADMIN'. Se cookie inválido/faltando -> Redireciona para /login.
/ (Home): Exige qualquer usuário logado. Se cookie inválido -> Redireciona para /login.
/login: Se cookie válido -> Redireciona para /admin (se admin) ou / (se user).
API Endpoints (/api/dados):

GET: Aceita autenticação via Cookie (Server-side) OU Header Bearer (Client-side). Deve retornar dados se qualquer um estiver válido.
PUT: Exige role === 'ADMIN'. Validação estrita via Cookie ou Token decodificado.
5.2. Dashboard
Modo Admin (/admin):
Permite edição dos registros (inputs editáveis).
Botões de "Salvar" que chamam PUT /api/dados.
Gráficos interativos.
Modo Usuário (/):
Apenas visualização (readonly).
Banner indicando "Modo Leitura".
Gráficos estáticos.
5.3. Seed Data
Usuário 1: cadastro / 160922 (Role: ADMIN)
Usuário 2: comercial / 123456 (Role: USER)
Registros: 9 registros iniciais variados para teste de gráficos.
6. Requisitos Não Funcionais
Segurança: Senhas hashadas com bcrypt (salt rounds >= 10). Cookies HttpOnly para prevenir XSS.
Performance: Carregamento inicial rápido (RSC). Gráficos renderizados apenas no cliente (useEffect).
Responsividade: Layout adaptável para desktop e mobile.
Tratamento de Erros: Mensagens claras no Toast se falhar login ou salvar dados.
7. Plano de Ação Imediato (Sprint 01)
Foco: Resolver o "Infinite Loading" e estabilizar a autenticação.

Refatorar lib/auth.ts e lib/session.ts: Garantir que a leitura do cookie no servidor seja robusta.
Corrigir proxy.ts (Middleware):
Garantir que a verificação de sessão ocorra antes de renderizar o componente.
Remover dependência de sessionStorage para redirecionamentos de rota.
Ajustar components/Dashboard.tsx:
Remover lógica de redirecionamento baseada em erro 401 do cliente.
Deixar o servidor (Next.js) controlar o fluxo de login/logout.
Testes Manuais:
Login como Admin -> Acessar /admin -> Fechar aba -> Abrir nova -> Verificar se mantém sessão (Cookie).
Login como User -> Tentar acessar /admin -> Deve bloquear.
Tentar acessar /api/dados sem token -> Deve retornar 401 limpo, sem loop.
8. Instruções para o OpenCode (MiniMax M2.7)
Prioridade Máxima: A correção do loop de autenticação é crítica. Não avance para novas funcionalidades sem resolver isso.
Abordagem: Ao gerar código, priorize a consistência entre o lado do servidor (Cookies) e o lado do cliente (Headers).
Validação: Sempre que gerar uma rota protegida, inclua comentários explicando como a autenticação é verificada.
Erro Comum a Evitar: Nunca confiar apenas no sessionStorage para proteger rotas no Next.js App Router. O servidor deve ser a fonte da verdade.