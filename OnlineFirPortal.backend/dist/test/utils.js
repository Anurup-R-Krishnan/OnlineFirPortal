"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_DB_PATH = void 0;
exports.cleanDatabase = cleanDatabase;
exports.ensureCleanTestDb = ensureCleanTestDb;
exports.uniqueEmail = uniqueEmail;
exports.startTestServer = startTestServer;
exports.stopTestServer = stopTestServer;
exports.waitForLog = waitForLog;
exports.waitForOtp = waitForOtp;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const prisma_1 = require("../src/lib/prisma");
async function cleanDatabase() {
    const tablenames = await prisma_1.prisma.$queryRaw `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_migrations';`;
    for (const { name } of tablenames) {
        try {
            await prisma_1.prisma.$executeRawUnsafe(`DELETE FROM "${name}";`);
        }
        catch (error) {
            // ignore foreign key errors first pass
        }
    }
    // serious cleanup
    const deleteOrder = [
        'AuditLog', 'Timeline', 'Document', 'Notification',
        'Session', 'MFARecoveryCode', 'PasswordResetToken',
        'FIR', 'User'
    ];
    // Use transaction for speed and safety
    try {
        await prisma_1.prisma.auditLog.deleteMany({});
        await prisma_1.prisma.timeline.deleteMany({});
        await prisma_1.prisma.document.deleteMany({});
        await prisma_1.prisma.notification.deleteMany({});
        await prisma_1.prisma.session.deleteMany({});
        await prisma_1.prisma.mFARecoveryCode.deleteMany({});
        await prisma_1.prisma.passwordResetToken.deleteMany({});
        await prisma_1.prisma.fIR.deleteMany({});
        await prisma_1.prisma.user.deleteMany({});
    }
    catch (e) {
        console.error('cleanup failed', e);
    }
}
exports.TEST_DB_PATH = path_1.default.join(process.cwd(), 'data', 'firs.test.db');
const TEST_PORT = 3101;
let serverProcess = null;
let serverLogs = [];
let otpByEmail = new Map();
function ensureCleanTestDb() {
    const dataDir = path_1.default.join(process.cwd(), 'data');
    if (!fs_1.default.existsSync(dataDir)) {
        fs_1.default.mkdirSync(dataDir, { recursive: true });
    }
    if (fs_1.default.existsSync(exports.TEST_DB_PATH)) {
        fs_1.default.unlinkSync(exports.TEST_DB_PATH);
    }
}
function uniqueEmail(prefix) {
    const stamp = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    return `${prefix}.${stamp}.${rand}@example.com`;
}
function addLogLine(line) {
    serverLogs.push(line);
    const otpMatch = line.match(/Generated OTP for\s+([^:]+):\s*(\d{6})/i) ||
        line.match(/OTP for\s+([^:]+)\s*:\s*(\d{6})/i);
    if (otpMatch?.[1] && otpMatch?.[2]) {
        const email = otpMatch[1].trim();
        const otp = otpMatch[2];
        otpByEmail.set(email, otp);
    }
}
function attachLogListeners(proc) {
    let buffer = '';
    proc.stdout.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        lines.forEach((line) => addLogLine(line));
    });
    proc.stderr.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        lines.forEach((line) => addLogLine(line));
    });
}
async function startTestServer() {
    if (serverProcess) {
        return { baseUrl: `http://localhost:${TEST_PORT}`, stop: stopTestServer };
    }
    ensureCleanTestDb();
    serverLogs = [];
    otpByEmail = new Map();
    serverProcess = (0, child_process_1.spawn)('node', ['-r', 'ts-node/register', 'src/server.ts'], {
        cwd: process.cwd(),
        env: {
            ...process.env,
            PORT: `${TEST_PORT}`,
            NODE_ENV: 'test',
            DATABASE_PATH: exports.TEST_DB_PATH,
            RESEND_API_KEY: '',
            JWT_SECRET: 'test-jwt-secret',
            JWT_REFRESH_SECRET: 'test-jwt-refresh-secret',
            ENCRYPTION_KEY: '01234567890123456789012345678901', // 32 chars
        },
    });
    attachLogListeners(serverProcess);
    await waitForLog(/Server running on port\s+3101/i, 10000);
    return { baseUrl: `http://localhost:${TEST_PORT}`, stop: stopTestServer };
}
async function stopTestServer() {
    if (!serverProcess)
        return;
    serverProcess.kill('SIGTERM');
    serverProcess = null;
}
async function waitForLog(pattern, timeoutMs = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        if (serverLogs.some((line) => pattern.test(line)))
            return;
        await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error(`Timed out waiting for log: ${pattern}`);
}
async function waitForOtp(email, timeoutMs = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const otp = otpByEmail.get(email);
        if (otp)
            return otp;
        await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error(`Timed out waiting for OTP for ${email}`);
}
//# sourceMappingURL=utils.js.map