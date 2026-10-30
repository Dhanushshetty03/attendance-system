# Production Deployment & Operations Guide

## 1. Overview

This document outlines deployment configurations, environment variables, database setup (SQLite for zero-friction local/dev runs, and PostgreSQL for enterprise production), and process management.

---

## 2. Environment Variables Configuration

Copy `.env.example` to `server/.env` and configure production secrets:

```env
# Server
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://portal.logisys.edu

# Database (PostgreSQL Production)
DATABASE_URL="postgresql://postgres:SecurePassword123@db.internal:5432/logisys_attendance?schema=public"

# Authentication Security
JWT_SECRET=use-a-strong-random-256-bit-key-in-production
JWT_EXPIRES_IN=7d

# Institution Details
INSTITUTION_NAME="National Institute of Engineering & Technology"
ATTENDANCE_THRESHOLD=75
CRITICAL_THRESHOLD=65
```

---

## 3. Database Switching: SQLite to PostgreSQL

The codebase is built with Prisma ORM, enabling seamless switching between local SQLite development and production PostgreSQL without modifying application logic.

To switch to PostgreSQL:
1. In `server/prisma/schema.prisma`, update the datasource:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
2. Generate Prisma Client and apply migrations:
```bash
cd server
npx prisma generate
npx prisma migrate deploy
node prisma/seed.js
```

---

## 4. Production Build & Execution

### 4.1 Frontend Build
Build the optimized static assets:
```bash
npm run build
```
The compiled output is located in `dist/` and can be served via Nginx, Caddy, or Cloudflare Pages.

### 4.2 Backend Process Execution
Use **PM2** or **Docker** to ensure persistent execution with automatic restarts:

```bash
# Using PM2
npm install -g pm2
cd server
pm2 start src/app.js --name "logisys-api" -i max
pm2 save
pm2 startup
```

---

## 5. Reverse Proxy Configuration (Nginx Example)

```nginx
server {
    listen 80;
    server_name portal.logisys.edu;

    # Static Frontend
    location / {
        root /var/www/logisys-portal/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Reverse Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
