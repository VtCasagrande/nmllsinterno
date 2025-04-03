# Estágio de build
FROM node:18-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

# Definir variáveis de ambiente para build
ENV NEXT_PUBLIC_SUPABASE_URL=https://rnqdwjslfoxtdchxzgfr.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucWR3anNsZm94dGRjaHh6Z2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0MjYwNDUsImV4cCI6MjA1OTAwMjA0NX0.xsvV72Gb8GVFcLMdMBwjn93WXZdXxNvS3ozfrgrnpbI
ENV NODE_ENV=production

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Instalar explicitamente o tailwindcss, postcss e autoprefixer
RUN npm install --save tailwindcss postcss autoprefixer

# Copiar o restante dos arquivos
COPY . .

# Garantir que os arquivos de configuração do tailwind estejam presentes
RUN if [ ! -f tailwind.config.js ]; then npx tailwindcss init; fi
RUN if [ ! -f postcss.config.js ]; then echo "module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }" > postcss.config.js; fi

# Imprimir configurações para debug durante a build
RUN echo "SUPABASE URL: $NEXT_PUBLIC_SUPABASE_URL"
RUN echo "SUPABASE KEY (primeiros 10 caracteres): ${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:10}..."
RUN echo "NODE_ENV: $NODE_ENV"

# Construir o aplicativo
RUN npm run build

# Estágio de execução
FROM node:18-alpine AS runner

WORKDIR /code

# Definir como ambiente de produção e configurar Supabase
ENV NODE_ENV=production
ENV NEXT_PUBLIC_SUPABASE_URL=https://rnqdwjslfoxtdchxzgfr.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucWR3anNsZm94dGRjaHh6Z2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0MjYwNDUsImV4cCI6MjA1OTAwMjA0NX0.xsvV72Gb8GVFcLMdMBwjn93WXZdXxNvS3ozfrgrnpbI

# Copiar arquivos necessários do estágio de build
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/tailwind.config.js ./
COPY --from=builder /app/postcss.config.js ./

# Copiar script de entrypoint personalizado para verificar ambiente antes de iniciar
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Expor a porta que o Next.js usa
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["./entrypoint.sh"]