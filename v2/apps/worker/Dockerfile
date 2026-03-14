FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/worker/package.json ./apps/worker/
RUN npm install --workspace=apps/worker --workspace=packages/shared

# Copy root tsconfig (extended by all sub-projects)
COPY tsconfig.base.json ./

# Copy source
COPY packages/shared/ ./packages/shared/
COPY apps/worker/ ./apps/worker/

# Build shared first, then worker
RUN npm run build --workspace=packages/shared 2>/dev/null || true
RUN npx tsc --project apps/worker/tsconfig.json --outDir apps/worker/dist || true

CMD ["node", "apps/worker/dist/index.js"]
