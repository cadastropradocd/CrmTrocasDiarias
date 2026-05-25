#!/usr/bin/env bash
# Script para rodar migrations no Supabase

# Configuração (mude a senha se necessário)
export DIRECT_URL="postgresql://postgres.sxauaqndqehjpfyfwaad:@Pradocd++@@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"
export DATABASE_URL="postgresql://postgres.sxauaqndqehjpfyfwaad:@Pradocd++@@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

echo "Running Prisma migrations..."

# Push schema (mais rápido para primeira vez)
npx prisma db push --accept-data-loss

# OU se preferir migrations:
# npx prisma migrate deploy

echo "Done!"