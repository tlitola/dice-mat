FROM node:18.17.0-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci && rm -rf ~/.npm

COPY . .

RUN npm run build

FROM node:18.17.0-alpine as prod

WORKDIR /app

COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public

CMD ["node", "server.js"]