# ========================================
# DOCKERFILE PRODUCTION - AL-IMAM
# ========================================

FROM node:20-slim AS base
RUN apt-get update && apt-get install -y openssl libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm

# 1. Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Tambahkan ARG untuk build-time (Coolify akan menyuntikkan ini)
ARG DATABASE_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET

# Set ENV agar bisa dibaca oleh Next.js build
ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET

# Generate Prisma Client
RUN npx prisma generate
RUN pnpm run build

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install prisma CLI so we can run db push at runtime
RUN npm install -g prisma@5.22.0

RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -s /bin/sh -m nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy prisma folder & package.json untuk migrasi database
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/scripts ./scripts

# Buat direktori penyimpanan lokal dan atur CHOWN agar user nextjs bisa menulis file
RUN mkdir -p /app/storage_data && chown -R nextjs:nodejs /app/storage_data

# USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "node scripts/push-db.js && node server.js"]
