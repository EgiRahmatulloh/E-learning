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

# Salin package.json, lockfile, tsconfig, dan drizzle config
COPY package.json bun.lock tsconfig.json drizzle.config.ts ./

# Instal semua dependensi agar drizzle-kit dapat digunakan saat inisialisasi database
RUN bun install --frozen-lockfile

# Salin hasil build frontend dari stage builder
COPY --from=builder /app/dist ./dist

# Salin kode backend Elysia
COPY --from=builder /app/src ./src

# Expose port yang digunakan aplikasi (default: 3000)
EXPOSE 3000

# Jalankan inisialisasi/push skema database lalu mulai server
CMD ["sh", "-c", "bun run db:push && bun run start"]
