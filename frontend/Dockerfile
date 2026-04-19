# ==============================================
# 🏗️ DOCKERFILE PARA REMIX
# ==============================================
FROM node:18-alpine

# Instalar dependencias básicas
RUN apk add --no-cache libc6-compat

# Directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json ./

# Instalar dependencias (incluyendo devDependencies para el build)
RUN npm install --silent

# Copiar configuraciones
COPY tailwind.config.ts postcss.config.js vite.config.ts tsconfig.json remix.config.js ./

# Copiar el resto del proyecto
COPY . .

# Build para producción (esto compilará Tailwind)
RUN npm run build

# Exponer puerto 3000 (Remix default)
EXPOSE 3000

# Iniciar el servidor de Remix directamente
CMD ["npm", "start"]