FROM node:22-alpine
WORKDIR /app
# pnpm 11.x requires Node >= 22.13 (uses node:sqlite)
RUN corepack enable && corepack prepare pnpm@11.5.2 --activate

# Monorepo root — build with: docker build -f apps/backend/Dockerfile .
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/tsconfig.json ./apps/backend/
COPY apps/backend/src ./apps/backend/src

RUN pnpm install --frozen-lockfile --filter backend...

WORKDIR /app/apps/backend
RUN pnpm build

EXPOSE 3000
CMD ["node", "dist/index.js"]
