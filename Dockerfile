# ============================
# 1) BUILD STAGE
# ============================
FROM node:20-alpine AS builder

WORKDIR /app

# Remove macOS AppleDouble files (for mac users)
RUN find . -name "._*" -delete

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN find . -name "._*" -delete

# Build the Next.js application
RUN npm run build


# ============================
# 2) RUNTIME STAGE
# ============================
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Override default Next.js port to avoid conflict with API Proxy
ENV PORT=3001

# Copy entire build output
COPY --from=builder /app ./

EXPOSE 3001

CMD ["npm", "start"]
