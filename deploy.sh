#!/bin/bash
set -e  # Interromper execução caso ocorra algum erro

cd /code

# Setar variáveis de ambiente ANTES da build
export NEXT_PUBLIC_SUPABASE_URL=https://rnqdwjslfoxtdchxzgfr.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
export NEXT_PUBLIC_STORAGE_DEVOLUCOES_BUCKET=devolucoes
export NEXT_PUBLIC_STORAGE_PROFILE_BUCKET=profile-images
export NEXT_PUBLIC_STORAGE_BUCKET=nmalls-storage
export NEXT_PUBLIC_APP_URL=https://nmallsinterno-nmallsinterno.op6qrj.easypanel.host/
export NEXT_PUBLIC_API_URL=https://nmallsinterno-nmallsinterno.op6qrj.easypanel.host/api
export NODE_ENV=production

echo "Atualizando código do repositório..."
git pull origin main

echo "Instalando dependências..."
# Forçar instalação de todas as dependências, incluindo devDependencies
npm install --include=dev

echo "Construindo aplicação..."
npm run build

echo "Reiniciando servidor..."
supervisorctl restart nextjs-server

echo "Implantação concluída com sucesso!" 