# ---- build stage: needs the full toolchain to compile the client bundle ----
FROM node:22-slim AS builder

WORKDIR /app

# Manifests first so `npm ci` stays cached across source-only changes.
COPY package.json package-lock.json ./
COPY packages/engine/package.json packages/engine/
COPY packages/protocol/package.json packages/protocol/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/

RUN npm ci

COPY . .

RUN npm run build

# ---- runtime stage: production deps + TS source + the built bundle ----
FROM node:22-slim

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4000

COPY package.json package-lock.json ./
COPY packages/engine/package.json packages/engine/
COPY packages/protocol/package.json packages/protocol/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/

RUN npm ci --omit=dev && npm cache clean --force

# The server runs TypeScript directly via tsx, and engine/protocol resolve
# through workspace symlinks to their raw src — so the source ships as-is.
COPY packages/engine/src packages/engine/src
COPY packages/protocol/src packages/protocol/src
COPY packages/server/src packages/server/src

# tsx reads this to resolve the server's `@/*` path alias at runtime.
COPY packages/server/tsconfig.json packages/server/

COPY --from=builder /app/packages/client/dist packages/client/dist

EXPOSE 4000

CMD ["npm", "start"]
