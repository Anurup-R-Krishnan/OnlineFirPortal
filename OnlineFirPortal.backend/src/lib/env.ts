import path from 'path';
import dotenvSafe from 'dotenv-safe';

const isTestEnv =
    process.env.NODE_ENV === 'test' ||
    typeof process.env.JEST_WORKER_ID !== 'undefined' ||
    typeof process.env.BUN_TEST !== 'undefined' ||
    process.argv.includes('test');

if (!isTestEnv) {
    dotenvSafe.config({
        example: path.resolve(process.cwd(), '.env.example'),
        allowEmptyValues: false,
    });
}

function getRequiredEnv(
    name: string,
    options?: { allowTestFallback?: boolean; testFallback?: string }
): string {
    const value = process.env[name];
    if (value && value.trim().length > 0) {
        return value;
    }

    if (isTestEnv && options?.allowTestFallback) {
        const fallback = options.testFallback ?? `test-${name.toLowerCase()}`;
        process.env[name] = fallback;
        return fallback;
    }

    throw new Error(`Missing required environment variable: ${name}`);
}

export const env = {
    isTestEnv,
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 4001),
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:4000',
    jwtSecret: getRequiredEnv('JWT_SECRET', {
        allowTestFallback: true,
        testFallback: 'test-jwt-secret',
    }),
    jwtRefreshSecret: getRequiredEnv('JWT_REFRESH_SECRET', {
        allowTestFallback: true,
        testFallback: 'test-jwt-refresh-secret',
    }),
    encryptionKey: getRequiredEnv('ENCRYPTION_KEY', {
        allowTestFallback: true,
        testFallback: 'test-encryption-key',
    }),
    firEncryptionKey: getRequiredEnv('FIR_ENCRYPTION_KEY', {
        allowTestFallback: true,
        testFallback: 'test-fir-encryption-key',
    }),
};
