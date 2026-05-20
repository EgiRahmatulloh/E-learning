# Stage 1: Build stage
FROM oven/bun:1 AS builder
WORKDIR /app

# Salin package.json dan lockfile untuk instalasi dependency
COPY package.json bun.lock ./

# Instal semua dependency (termasuk devDependencies untuk build frontend)
RUN bun install --frozen-lockfile

# Salin seluruh kode sumber
COPY . .

# Build aplikasi frontend (menghasilkan folder dist/ menggunakan Vite)
RUN bun run build

# Stage 2: Production runner stage
FROM oven/bun:1-slim AS runner
WORKDIR /app

# Atur environment ke production
ENV NODE_ENV=production
ENV PORT=3000

# Salin package.json, lockfile, dan tsconfig (untuk resolusi path alias Bun)
COPY package.json bun.lock tsconfig.json ./

# Instal hanya dependency production untuk menghemat ruang
RUN bun install --frozen-lockfile --production

# Salin hasil build frontend dari stage builder
COPY --from=builder /app/dist ./dist

# Salin kode backend Elysia
COPY --from=builder /app/src ./src

# Expose port yang digunakan aplikasi (default: 3000)
EXPOSE 3000

# Jalankan server menggunakan skrip start yang ada di package.json
CMD ["bun", "run", "start"]
