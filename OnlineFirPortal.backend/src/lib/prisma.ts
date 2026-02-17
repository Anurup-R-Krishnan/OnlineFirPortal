import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const globalForPrisma = global as unknown as { prisma: PrismaClient; prismaMigrated?: boolean };

const isTestEnv =
    process.env.NODE_ENV === 'test' ||
    typeof process.env.JEST_WORKER_ID !== 'undefined' ||
    typeof process.env.BUN_TEST !== 'undefined' ||
    process.argv.includes('test');

if (isTestEnv || process.env.DATABASE_PATH) {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = process.env.DATABASE_PATH
        ? path.resolve(process.env.DATABASE_PATH)
        : path.join(dataDir, 'firs.test.db');
    process.env.DATABASE_URL = `file:${dbPath}`;
}

if (isTestEnv && !globalForPrisma.prismaMigrated) {
    globalForPrisma.prismaMigrated = true;
    // Try bunx first (faster in bun environments); fall back to npx if unavailable
    try {
        execSync('bunx prisma migrate deploy', {
            stdio: 'inherit',
            env: process.env,
        });
    } catch (err) {
        console.warn('[prisma] bunx not available, falling back to npx prisma migrate deploy');
        execSync('npx prisma migrate deploy', {
            stdio: 'inherit',
            env: process.env,
        });
    }
}

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
