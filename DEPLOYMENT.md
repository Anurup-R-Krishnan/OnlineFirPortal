# Online FIR Portal - Usage & Deployment Guide

## Overview
This is a secure, government-grade online FIR portal built with Next.js (Frontend) and Express/Prisma (Backend). It features strict role-based access control, digital signatures, and comprehensive audit logging.

## Prerequisites
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14 or higher (for Production) / SQLite (for Dev)
- **NPM** or **Bun**

## 1. Installation

### Backend
```bash
cd OnlineFirPortal.backend
npm install
```

### Frontend
```bash
cd OnlineFirPortal.frontend
npm install
```

## 2. Environment Setup
Copy the example environment files and update the values.

### Backend (.env)
```bash
cp .env.example .env
```
Update the following keys in `.env` (Use `src/scripts/generate-keys.ts` to generate secure secrets):
- `DATABASE_URL`: Connection string for your database.
- `JWT_SECRET`: 64-char random hex string.
- `JWT_REFRESH_SECRET`: 64-char random hex string.
- `ENCRYPTION_KEY`: 32-byte (64-char hex) key for data encryption.

### Frontend (.env.local)
```bash
cp .env.example .env.local
```

## 3. Database Setup (Production)
1. Ensure your PostgreSQL server is running.
2. Update `DATABASE_URL` in `.env`.
3. Run migrations:
```bash
npx prisma migrate deploy
```

## 4. Key Generation
We provide a utility script to generate secure cryptographic keys.
```bash
cd OnlineFirPortal.backend
npx ts-node src/scripts/generate-keys.ts
```

## 5. Building for Production

### Backend
```bash
cd OnlineFirPortal.backend
npm run build
# Starts the server on port 3001
node dist/server.js
```

### Frontend
```bash
cd OnlineFirPortal.frontend
npm run build
# Starts the Next.js server on port 3000
npm start
```

## 6. Security & Policy Compliance
- **Data Retention**: FIRs are permanent. Logs are retained for 90 days.
- **Auditing**: All actions are logged in the `AuditLog` table.
- **Backups**: Configure daily backups for your PostgreSQL database using `pg_dump`.

## 7. Troubleshooting
- **CORS Issues**: Ensure `NEXT_PUBLIC_API_URL` matches the backend URL exactly.
- **Database Errors**: Check `DATABASE_URL` and ensure migrations are applied.

## 8. Docker Deployment (Recommended)
We have provided a production-ready `docker-compose.yml`.
1. Ensure Docker and Docker Compose are installed.
2. Run `docker-compose up -d --build`.
3. The app will be available at `https://fir.gov.in` (configured in `nginx.conf`).

## 9. Maintenance Scripts
- **Backup**: Run `./backup.sh` to backup the database (auto-rotation enabled).
- **Monitoring**: Run `./monitor.sh` for a quick health check.

