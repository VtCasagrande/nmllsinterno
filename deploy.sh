#!/bin/bash

# Ir para o diretório do código
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

# Obter as atualizações mais recentes
git pull origin main

# Instalar dependências
npm install

# Garantir que o tailwindcss e postcss estejam instalados explicitamente
npm install --save tailwindcss postcss autoprefixer

# Verificar se o arquivo de configuração do tailwind está presente
if [ ! -f tailwind.config.js ]; then
  echo "tailwind.config.js não encontrado, criando arquivo padrão"
  npx tailwindcss init
fi

# Verificar se o arquivo de configuração do postcss está presente
if [ ! -f postcss.config.js ]; then
  echo "postcss.config.js não encontrado, criando arquivo padrão"
  echo "module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }" > postcss.config.js
fi

# Executar a build
npm run build

# Reiniciar o servidor
supervisorctl restart nextjs-server 