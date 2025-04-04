#!/bin/bash

# Script de deploy para NMalls App
echo "Iniciando deploy do NMalls App..."

# Verificar diretório atual
echo "Diretório atual:"
pwd
ls -la

# Verificar se estamos no diretório correto (contendo package.json)
if [ ! -f "package.json" ]; then
  echo "Erro: package.json não encontrado no diretório atual."
  echo "Verificando diretório /code:"
  
  if [ -d "/code" ]; then
    echo "Navegando para /code"
    cd /code
    
    echo "Conteúdo do diretório /code:"
    ls -la
    
    if [ ! -f "package.json" ]; then
      echo "Erro crítico: package.json não encontrado em /code."
      exit 1
    fi
  else
    echo "Erro crítico: Diretório /code não existe."
    exit 1
  fi
fi

# Verificar ambiente Node.js
echo "Versão do Node.js:"
node -v
echo "Versão do NPM:"
npm -v

# Verificar conteúdo do package.json
echo "Verificando package.json:"
cat package.json

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
  # Iniciar o servidor usando supervisorctl para manter o processo após o término do script
  npm run start
else
  echo "Falha no build. Verifique os logs acima para mais detalhes."
  exit 1
fi 