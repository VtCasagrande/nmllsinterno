#!/bin/sh

# Script de entrypoint para o container Docker
# Verifica as variáveis de ambiente e inicia o servidor

echo "===== INICIANDO APLICAÇÃO NMALLS INTERNO ====="
echo "Data e hora: $(date)"
echo "Diretório atual: $(pwd)"

# Verificar variáveis de ambiente do Supabase
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "ERRO: NEXT_PUBLIC_SUPABASE_URL não está definida"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "ERRO: NEXT_PUBLIC_SUPABASE_ANON_KEY não está definida"
    exit 1
fi

echo "Verificando configuração do Supabase:"
echo "SUPABASE URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "SUPABASE KEY (primeiros 10 caracteres): ${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:10}..."
echo "NODE_ENV: $NODE_ENV"

# Verificar se a chave contém 'role":"anon"'
if ! echo "$NEXT_PUBLIC_SUPABASE_ANON_KEY" | grep -q 'role":"anon'; then
    echo "ALERTA: A chave do Supabase não parece ser uma chave anônima!"
    echo "Por favor, verifique se você está usando a chave anon correta"
fi

# Verificar se os arquivos necessários estão presentes
if [ ! -f "server.js" ]; then
    echo "ERRO: server.js não encontrado"
    exit 1
fi

# Criar um arquivo .env local para garantir que as variáveis estejam disponíveis
echo "# Arquivo .env gerado pelo entrypoint.sh" > .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY" >> .env.local
echo "NODE_ENV=$NODE_ENV" >> .env.local

echo "Arquivo .env.local criado com sucesso."
echo "===== INICIANDO SERVIDOR NEXT.JS ====="

# Iniciar o servidor Next.js
exec node server.js 