# Estágio de build
FROM node:18-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

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
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/tailwind.config.js ./
COPY --from=builder /app/postcss.config.js ./

# Expor a porta que o Next.js usa
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "server.js"]