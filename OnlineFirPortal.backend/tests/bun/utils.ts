import path from 'path';
import fs from 'fs';
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';

export const TEST_DB_PATH = path.join(process.cwd(), 'data', 'firs.test.db');
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = TEST_DB_PATH;

export async function cleanDatabase() {
  // Bun tests talk to a separate server process. Cleaning through a second
  // Prisma client can trigger SQLite readonly/locking issues across processes.
  // Use unique test data per case instead of cross-process DB cleanup.
  return;
}
const TEST_PORT = 3101;

let serverProcess: ChildProcessWithoutNullStreams | null = null;
let serverLogs: string[] = [];
let otpByEmail = new Map<string, string>();

export function ensureCleanTestDb() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
}

export function uniqueEmail(prefix: string) {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}.${stamp}.${rand}@example.com`;
}

function addLogLine(line: string) {
  serverLogs.push(line);
  const otpMatch =
    line.match(/Generated OTP for\s+([^:]+):\s*(\d{6})/i) ||
    line.match(/OTP for\s+([^:]+)\s*:\s*(\d{6})/i);
  if (otpMatch?.[1] && otpMatch?.[2]) {
    const email = otpMatch[1].trim();
    const otp = otpMatch[2];
    otpByEmail.set(email, otp);
  }
}

function attachLogListeners(proc: ChildProcessWithoutNullStreams) {
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

export async function startTestServer() {
  if (serverProcess) {
    return { baseUrl: `http://localhost:${TEST_PORT}`, stop: stopTestServer };
  }

  ensureCleanTestDb();
  serverLogs = [];
  otpByEmail = new Map();

  serverProcess = spawn('node', ['-r', 'ts-node/register', 'src/server.ts'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: `${TEST_PORT}`,
      NODE_ENV: 'test',
      DATABASE_PATH: TEST_DB_PATH,
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

export async function stopTestServer() {
  if (!serverProcess) return;
  serverProcess.kill('SIGTERM');
  serverProcess = null;
}

export async function waitForLog(pattern: RegExp, timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (serverLogs.some((line) => pattern.test(line))) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`Timed out waiting for log: ${pattern}`);
}

export async function waitForOtp(email: string, timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const otp = otpByEmail.get(email);
    if (otp) return otp;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`Timed out waiting for OTP for ${email}`);
}
