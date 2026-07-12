# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN npm install -g pnpm@10
WORKDIR /repo

# =========================
# Build Stage
# =========================
FROM base AS build

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/

RUN pnpm install --frozen-lockfile

# Copy the full repository (includes input/)
COPY . .

RUN pnpm --filter api build

# =========================
# Production Dependencies
# =========================
FROM base AS prod-deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/

RUN pnpm install --frozen-lockfile --prod

# =========================
# Runtime
# =========================
FROM node:22-alpine

ENV NODE_ENV=production
ENV AGENT_MODE=batch

WORKDIR /repo/apps/api

COPY --from=prod-deps /repo/node_modules /repo/node_modules
COPY --from=prod-deps /repo/apps/api/node_modules ./node_modules

COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/input /repo/input

COPY apps/api/package.json ./package.json

CMD ["node", "dist/main"]