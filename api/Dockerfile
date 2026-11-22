
# Etapa 1: instalar dependencias de producción
FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

# Etapa 2: imagen final de producción
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Reutilizar las dependencias de la primera etapa
COPY --from=dependencies /app/node_modules ./node_modules

# Copiar los archivos necesarios de la API
COPY --chown=node:node package*.json ./
COPY --chown=node:node src ./src

USER node

EXPOSE 3000

CMD ["node", "src/server.js"]
