FROM node:24-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production=false
COPY . .

FROM base AS dev

FROM base AS production
ENV NODE_ENV=production
RUN npm prune --production
CMD ["node", "src/index.js"]
