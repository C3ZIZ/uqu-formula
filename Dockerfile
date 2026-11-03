# Builds two images: "web" runs the site, and "tools" applies migrations and seed data.
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM deps AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-alpine AS web
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
# Password hashing runs in this thread pool, so a larger pool handles login rushes better.
ENV UV_THREADPOOL_SIZE=8
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]

FROM deps AS tools
COPY tsconfig.json drizzle.config.ts ./
COPY src ./src
USER node
CMD ["sh", "-c", "npx tsx src/db/migrate.ts && npx tsx src/db/seed.ts"]
