FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

RUN npx prisma generate

COPY . .

RUN npm run build

# ─── Production ───────────────────────────────────────────────────────────────

FROM node:20-alpine AS production
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev && npx prisma generate

COPY --from=builder /app/dist ./dist

RUN mkdir -p uploads

EXPOSE 8080

CMD ["node", "dist/src/main.js"]
