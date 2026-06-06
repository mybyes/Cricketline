FROM node:20-alpine
WORKDIR /app
RUN npm i -g pnpm

# Monorepo root — build with: docker build -f apps/backend/Dockerfile .
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/tsconfig.json ./apps/backend/
COPY apps/backend/src ./apps/backend/src

RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/backend
RUN pnpm build

EXPOSE 3000
CMD ["node", "dist/index.js"]
