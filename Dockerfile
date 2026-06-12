# =============================================================================
# Dockerfile — sp1-frontend (Angular 21)
#
# Etapa 1 (build): Compila la app con Node 22
# Etapa 2 (serve): Sirve el dist con nginx
#
# Para desarrollo local con hot-reload, usar ng serve directamente
# (no este Dockerfile) o docker compose --profile dev up frontend
# =============================================================================

# ── Etapa 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# Copiar manifiestos primero para aprovechar cache de Docker
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copiar código fuente y compilar
COPY . .
RUN npm run build -- --configuration production

# ── Etapa 2: Servir con nginx ─────────────────────────────────────────────────
FROM nginx:1.27-alpine AS serve

# Configuración nginx que redirige todas las rutas a index.html (SPA routing)
COPY --from=build /app/dist/sp1-frontend/browser /usr/share/nginx/html

# nginx config para Angular SPA + proxy al backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
