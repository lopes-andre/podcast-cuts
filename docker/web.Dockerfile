# Multi-stage build for Next.js frontend
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/web/package.json ./apps/web/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/database/package.json ./packages/database/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages ./packages

# Copy source
COPY . .

# Build the application
RUN pnpm --filter @podcast-highlighter/web build

# Production stage
FROM base AS production
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "apps/web/server.js"]

# Development stage
FROM base AS development
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8.15.0 turbo@2.0.14

# Copy everything for dev
COPY . .

# Install dependencies
RUN pnpm install

EXPOSE 3000

CMD ["pnpm", "dev"]

