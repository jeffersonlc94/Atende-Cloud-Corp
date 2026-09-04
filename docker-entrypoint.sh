#!/bin/sh
set -e

# Volumes nomeados podem ser criados como root pelo Docker. Corrige a
# propriedade em toda inicialização e executa a aplicação sem privilégios.
mkdir -p /app/public/uploads /app/storage/technical-files
chown -R nextjs:nodejs /app/public/uploads /app/storage

echo "Aplicando migrations (aguardando banco de dados ficar disponível)..."
attempt=0
until node_modules/.bin/prisma migrate deploy --schema=./prisma/schema.prisma; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    echo "Não foi possível aplicar as migrations após várias tentativas."
    exit 1
  fi
  echo "Banco ainda não disponível, tentando novamente em 2s... ($attempt/30)"
  sleep 2
done

echo "Executando seed inicial (idempotente)..."
node_modules/.bin/tsx prisma/seed.ts || echo "Seed não aplicado (pode já existir ou ter falhado de forma não crítica)."

echo "Iniciando aplicação..."
exec su-exec nextjs "$@"
