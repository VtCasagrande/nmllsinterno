#!/bin/bash

# Script de deploy para NMalls App
echo "Iniciando deploy do NMalls App..."

# Verificar ambiente Node.js
echo "Versão do Node.js:"
node -v
echo "Versão do NPM:"
npm -v

# Instalar dependências
echo "Instalando dependências..."
npm install

# Instalar TypeScript explicitamente
echo "Garantindo que TypeScript está instalado..."
npm install --save-dev typescript

# Limpar cache do Next.js (caso exista)
echo "Limpando cache..."
if [ -d ".next" ]; then
  rm -rf .next
fi

# Executar build do Next.js
echo "Executando build..."
npm run build

# Verificar se o build foi concluído com sucesso
if [ -d ".next" ]; then
  echo "Build concluído com sucesso. Iniciando o servidor..."
  # Iniciar o servidor
  npm run start
else
  echo "Falha no build. Verifique os logs acima para mais detalhes."
  exit 1
fi 