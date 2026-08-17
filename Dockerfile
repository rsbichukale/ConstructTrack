FROM node:20-alpine AS builder
WORKDIR /app

# Copy package descriptors
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install all workspace dependencies
RUN npm install
RUN npm install --prefix backend
RUN npm install --prefix frontend

# Copy application source code
COPY . .

# Build Next.js production bundle
RUN npm run build

# Production Runner Stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY --from=builder /app ./

EXPOSE 3000
EXPOSE 5000

CMD ["node", "launch-site-server.js"]
