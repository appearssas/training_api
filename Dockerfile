# Etapa de construcción
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package.json yarn.lock ./

# Instalar TODAS las dependencias (dev + prod)
RUN yarn install --frozen-lockfile

# Copiar el código fuente y archivos de configuración
COPY . .

# Construir la aplicación
RUN yarn build

# Etapa de producción
FROM node:22-alpine

WORKDIR /app

# Instalar dependencias de fuentes para sharp/librsvg
RUN apk add --no-cache fontconfig

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nestjs -u 1001

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copiar package.json y yarn.lock
COPY package.json yarn.lock ./

# Instalar dependencias de fuentes para sharp/librsvg
RUN apk add --no-cache fontconfig ttf-dejavu

# Instalar solo dependencias de producción
RUN yarn install --production --frozen-lockfile && \
  yarn cache clean

# Copiar fuentes al directorio del sistema y registrar nombres standar
COPY public/assets/fonts/*.ttf /usr/share/fonts/
RUN fc-cache -f -v && fc-list | grep Montserrat

# Copiar el código construido desde la etapa de builder
COPY --from=builder /app/dist ./dist

# Copiar archivos de configuración necesarios para migraciones
COPY --from=builder /app/typeorm.config.ts ./typeorm.config.ts
COPY --from=builder /app/scripts ./scripts

# Fix: Copiar archivos públicos (imágenes, SVGs) necesarios para generar PDF
COPY --from=builder /app/public ./public

# Cambiar propiedad de archivos al usuario no-root
RUN chown -R nestjs:nodejs /app

# Cambiar al usuario no-root
USER nestjs

# Exponer el puerto
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 || r.statusCode === 404 ? 0 : 1)})"

# Comando para iniciar la aplicación
CMD ["node", "dist/src/main.js"]
