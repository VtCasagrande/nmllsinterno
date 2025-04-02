# Estágio de build
FROM node:18-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar o restante dos arquivos
COPY . .

# Construir o aplicativo
RUN npm run build

# Estágio de execução
FROM node:18-alpine AS runner

WORKDIR /code

# Definir como ambiente de produção
ENV NODE_ENV=production

# Copiar arquivos necessários do estágio de build
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json

# Expor a porta que o Next.js usa
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "server.js"]