FROM node:18.17.0-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci && rm -rf ~/.npm

COPY . .

ENV NEXT_PUBLIC_SUPABASE_URL=!!!NEXT_PUBLIC_SUPABASE_URL!!!
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=!!!NEXT_PUBLIC_SUPABASE_ANON_KEY!!!

RUN npm run build

FROM node:18.17.0-alpine as prod

WORKDIR /app

COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public
COPY docker/entrypoint.sh .

ENTRYPOINT ["./entrypoint.sh"]

CMD ["node", "server.js"]