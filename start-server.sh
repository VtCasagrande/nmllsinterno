#!/bin/bash

# Script para iniciar o servidor Next.js com tratamento de falhas de porta
echo "Iniciando servidor Next.js..."

# Lista de portas alternativas para tentar
PORTS=(3000 3001 3002 3003 3004 3005)

for PORT in "${PORTS[@]}"; do
  echo "Tentando iniciar na porta $PORT..."
  
  # Verifica se a porta já está em uso
  if nc -z localhost $PORT > /dev/null 2>&1; then
    echo "A porta $PORT já está em uso, tentando próxima porta."
    continue
  fi
  
  # Tenta iniciar o servidor com a porta atual
  PORT=$PORT npm run start

  # Se chegou aqui, é porque o comando anterior falhou
  echo "Falha ao iniciar na porta $PORT."
done

echo "Erro: Não foi possível iniciar o servidor em nenhuma porta disponível."
exit 1 