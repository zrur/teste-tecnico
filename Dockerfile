# Dockerfile - Versão corrigida para Railway
FROM node:18-alpine

# Instalar dependências necessárias para Oracle
RUN apk add --no-cache \
    libaio \
    libnsl \
    libc6-compat \
    curl \
    unzip

# Criar diretório de trabalho
WORKDIR /app

# Copiar package files
COPY package*.json ./

# ✅ MUDANÇA: Usar npm install em vez de npm ci
# npm install é mais tolerante e funciona sem package-lock.json
RUN npm install --only=production

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Alterar propriedade dos arquivos
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expor porta (Railway define automaticamente)
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:$PORT/health || exit 1

# Comando para iniciar
CMD ["npm", "start"]