Atue como um Engenheiro de Software Sênior especialista em Next.js 16, TypeScript e Prisma.

CONTEXTO DO PROJETO:
Estou desenvolvendo um sistema "Relatório de Trocas Diário".
Stack: Next.js 16.2.6 (App Router), React 19, TypeScript, Prisma 7, SQLite (dev), JWT, bcryptjs.
Arquitetura atual: Autenticação híbrida (Cookie HttpOnly no servidor + sessionStorage no cliente) causando um BUG CRÍTICO de "Infinite Loading Loop" entre /admin e /login.

OBJETIVO DA SPRINT 1 (PRIORIDADE MÁXIMA):
Resolver o loop infinito de autenticação e estabilizar o fluxo de login/sessão.
NÃO implementar novas funcionalidades. Focar apenas na correção da arquitetura de autenticação.

PROBLEMA DETALHADO:
1. O servidor valida sessão via Cookie HttpOnly.
2. O cliente (Dashboard.tsx) tenta validar via sessionStorage.
3. Quando há dessincronização ou expiração, o cliente recebe 401 na API /api/dados.
4. O cliente dispara router.push('/login'), que redireciona de volta para /admin.
5. O ciclo se repete infinitamente.

TAREFAS DESENVOLVIDAS (GERAR CÓDIGO COMPLETO PARA OS ARQUIVOS ABAIXO):

1. REFACTOR: lib/auth.ts e lib/session.ts
   - Garantir que a geração do JWT e a definição do cookie sejam consistentes.
   - Cookie deve ter: HttpOnly, Secure (em prod), SameSite=Lax, Max-Age=86400 (24h).
   - Função getSession() deve ler APENAS do cookie e retornar null se inválido, sem depender do cliente.

2. REFACTOR: proxy.ts (ou middleware.ts se preferir a abordagem padrão Next.js)
   - Implementar proteção de rotas estrita no servidor.
   - /admin: Exige role='ADMIN' no cookie. Se falhar -> redirect 307 para /login.
   - / (Home): Exige qualquer cookie válido. Se falhar -> redirect 307 para /login.
   - /login: Se cookie já válido -> redirect para /admin (se admin) ou /.
   - REMOVER qualquer lógica de redirecionamento baseada em resposta de API do lado do cliente.

3. REFACTOR: components/Dashboard.tsx
   - Remover a lógica de "catch 401 -> router.push('/login')".
   - O componente deve assumir que, se foi renderizado, o servidor já validou a sessão.
   - Para chamadas de API (fetch), usar o token apenas se necessário, mas priorizar a sessão do cookie.
   - Tratar erros de rede de forma elegante (Toast), sem quebrar o fluxo de navegação.

4. CORREÇÃO: app/api/dados/route.ts
   - Endpoint GET: Deve aceitar autenticação via Cookie (via getSession) OU Header Bearer.
   - Endpoint PUT: Deve validar estritamente role='ADMIN'.
   - Garantir que não haja erros 401 intermitentes se a sessão estiver válida no cookie.

5. DOCUMENTAÇÃO:
   - Adicionar comentários explicando a mudança de paradigma: "Fonte da verdade é o Cookie HttpOnly, não o sessionStorage".

INSTRUÇÕES DE SAÍDA:
- Gere o código completo e corrigido para cada arquivo listado acima.
- Explique brevemente (1 parágrafo) por que cada mudança resolve o loop infinito.
- Não altere o banco de dados ou seed por enquanto.
- Mantenha a tipagem TypeScript rigorosa.

Comece agora.