# --- Etapa 1: Build del Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# --- Etapa 2: Build del Backend ---
FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --omit=dev

# --- Etapa 3: Imagen Final ---
FROM node:20-alpine
WORKDIR /app
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -s /bin/sh -D appuser
COPY --from=backend-builder /app/node_modules ./node_modules
COPY backend/src ./src
COPY --from=frontend-builder /app/frontend/dist ./public
USER appuser
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "src/index.js"]