#!/bin/bash

# Ir para o diretório do código
cd /code

# Setar variáveis de ambiente ANTES da build
export NEXT_PUBLIC_SUPABASE_URL=https://rnqdwjslfoxtdchxzgfr.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucWR3anNsZm94dGRjaHh6Z2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0MjYwNDUsImV4cCI6MjA1OTAwMjA0NX0.xsvV72Gb8GVFcLMdMBwjn93WXZdXxNvS3ozfrgrnpbI
export NEXT_PUBLIC_STORAGE_DEVOLUCOES_BUCKET=devolucoes
export NEXT_PUBLIC_STORAGE_PROFILE_BUCKET=profile-images
export NEXT_PUBLIC_STORAGE_BUCKET=nmalls-storage
export NEXT_PUBLIC_APP_URL=https://nmallsinterno-nmallsinterno.op6qrj.easypanel.host/
export NEXT_PUBLIC_API_URL=https://nmallsinterno-nmallsinterno.op6qrj.easypanel.host/api
export NODE_ENV=production

# Verificar a configuração do Supabase
echo "SUPABASE URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "SUPABASE KEY (primeiros 10 caracteres): ${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:10}..."
echo "NODE_ENV: $NODE_ENV"

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

# Verificar se a página de redirecionamento já tem o wrapper de Suspense
# (Isso é para garantir compatibilidade caso o arquivo não tenha sido atualizado pelo git)
REDIRECT_PAGE="src/app/redirect-to-dashboard/page.tsx"
if [ -f "$REDIRECT_PAGE" ] && ! grep -q "Suspense" "$REDIRECT_PAGE"; then
  echo "Adicionando wrapper de Suspense na página de redirecionamento"
  # Criar um backup do arquivo original
  cp "$REDIRECT_PAGE" "${REDIRECT_PAGE}.bak"
  # Usar sed para modificar o arquivo in-place
  sed -i -E 's/export default function RedirectToDashboard\(\) \{/function RedirectContent() {/' "$REDIRECT_PAGE"
  # Adicionar o wrapper de Suspense ao final do arquivo
  cat >> "$REDIRECT_PAGE" << 'EOL'

// Componente para mostrar durante o carregamento
function RedirectLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-2 text-blue-600">Carregando...</h1>
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-gray-600">Preparando redirecionamento...</p>
    </div>
  );
}

export default function RedirectToDashboard() {
  return (
    <Suspense fallback={<RedirectLoading />}>
      <RedirectContent />
    </Suspense>
  );
}
EOL
  # Adicionar o import do Suspense no topo do arquivo
  sed -i -E '0,/import React, \{ useState, useEffect/s//import React, { useState, useEffect, Suspense/' "$REDIRECT_PAGE"
fi

# Executar a build
npm run build

# Reiniciar o servidor
supervisorctl restart nextjs-server 