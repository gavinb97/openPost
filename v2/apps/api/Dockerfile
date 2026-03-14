FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN npm install --workspace=apps/api --workspace=packages/shared

# Copy source
COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/
COPY database/ ./database/

# Build shared first, then api
RUN npm run build --workspace=packages/shared 2>/dev/null || true
RUN npx tsc --project apps/api/tsconfig.json --outDir apps/api/dist || true

EXPOSE 5055
CMD ["node", "apps/api/dist/index.js"]
