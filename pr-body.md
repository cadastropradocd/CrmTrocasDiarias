## Resumo das Mudanças

### Bugs Corrigidos
- JWT payload: email → username
- Login: validação robusta de payload JSON
- Logout: agora limpa cookie HttpOnly
- Dashboard: removed redirect 401 (evitava loop infinito)
- PUT /api/dados: validação rigorosa de dados
- DateSelector: usa cookie em vez de Bearer token
- Dates: corrigido bug NaN/NaN/NaN (timezone mismatch)
- Variáveis não usadas: removidas (ESLint warnings)

### Segurança
- JWT_SECRET: exige em produção, falha com erro claro
- Validação server-side em todos endpoints
- RBAC funcional (ADMIN vs USER)

### Infraestrutura
- Supabase PostgreSQL configurado
- Prisma adapter dinâmico (SQLite dev / PostgreSQL prod)
- Schema atualizado para PostgreSQL
- Seed adaptado para ambos os bancos

### Docs
- spec.md atualizado (modelo TrocaDia+Registro)
- Auditoria de qualidade e segurança

## Testes
- [x] TypeScript: passou
- [x] ESLint: 0 warnings
- [x] Seed executado no Supabase
- [x] Schema criado com sucesso

## Checklist
- [x] Código testado localmente
- [x] Sem warnings de lint
- [x] TypeScript passando
- [x] Migration executada no Supabase
- [x] Seed executado (usuários + histórico 5 dias)