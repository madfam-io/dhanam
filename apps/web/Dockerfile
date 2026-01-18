# =============================================================================
# DHANAM WEB - Production Dockerfile
# =============================================================================
# Next.js frontend application
# Part of MADFAM ecosystem - connects to Dhanam API and Janua Auth
# =============================================================================

FROM node:20-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.6.7 --activate

WORKDIR /app

# =============================================================================
# Dependencies Stage
# =============================================================================
FROM base AS deps

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies
RUN pnpm install --frozen-lockfile

# =============================================================================
# Builder Stage
# =============================================================================
FROM base AS builder

COPY --from=deps /app ./
COPY . .

# Build arguments for Next.js
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_JANUA_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_JANUA_URL=$NEXT_PUBLIC_JANUA_URL

WORKDIR /app/apps/web
RUN pnpm build

# Debug: Show standalone structure (remove after confirming it works)
RUN ls -la .next/standalone/ && ls -la .next/standalone/apps/web/ 2>/dev/null || true

# =============================================================================
# Production Stage
# =============================================================================
FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

WORKDIR /app

# Copy built application (monorepo standalone structure)
# In monorepo, standalone includes the full path structure
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone/ ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# In monorepo standalone, server.js is at apps/web/server.js
CMD ["node", "apps/web/server.js"]
