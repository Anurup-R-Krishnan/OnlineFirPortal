"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const globalForPrisma = global;
const isTestEnv = process.env.NODE_ENV === 'test' ||
    typeof process.env.JEST_WORKER_ID !== 'undefined' ||
    typeof process.env.BUN_TEST !== 'undefined' ||
    process.argv.includes('test');
if (isTestEnv || process.env.DATABASE_PATH) {
    const dataDir = path_1.default.join(process.cwd(), 'data');
    if (!fs_1.default.existsSync(dataDir)) {
        fs_1.default.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = process.env.DATABASE_PATH
        ? path_1.default.resolve(process.env.DATABASE_PATH)
        : path_1.default.join(dataDir, 'firs.test.db');
    process.env.DATABASE_URL = `file:${dbPath}`;
}
if (isTestEnv && !globalForPrisma.prismaMigrated) {
    globalForPrisma.prismaMigrated = true;
    // Try bunx first (faster in bun environments); fall back to npx if unavailable
    try {
        (0, child_process_1.execSync)('bunx prisma migrate deploy', {
            stdio: 'inherit',
            env: process.env,
        });
    }
    catch (err) {
        console.warn('[prisma] bunx not available, falling back to npx prisma migrate deploy');
        (0, child_process_1.execSync)('npx prisma migrate deploy', {
            stdio: 'inherit',
            env: process.env,
        });
    }
}
exports.prisma = globalForPrisma.prisma ||
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
exports.default = exports.prisma;
//# sourceMappingURL=prisma.js.map