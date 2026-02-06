import { test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { prisma } from '../src/lib/prisma';
import {
  uniqueEmail,
  startTestServer,
  stopTestServer,
  cleanDatabase
} from './utils';

function randomMobile() {
  return `9${Math.floor(100000000 + Math.random() * 900000000)}`;
}

let baseUrl = '';

beforeAll(async () => {
  const server = await startTestServer();
  baseUrl = server.baseUrl;
});

afterAll(async () => {
  await stopTestServer();
});

beforeEach(async () => {
  await cleanDatabase();
});

async function postJson(path: string, body: Record<string, any>) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

test('register citizen and setup mfa', async () => {
  const email = uniqueEmail('citizen');
  const mobile = randomMobile();
  const password = 'SecureP@ssw0rd123';

  const registerRes = await postJson('/api/auth/register', {
    name: 'Test Citizen',
    email,
    mobile,
    password,
    aadhaar: '123412341234',
  });

  expect(registerRes.status).toBe(201);
  expect(registerRes.json?.success).toBe(true);
  expect(registerRes.json?.message).toContain('mfa');
  expect(registerRes.json?.userId).toBeTruthy();
});

test('login requires mfa setup for new users', async () => {
  const email = uniqueEmail('newuser');
  const mobile = randomMobile();
  const password = 'SecureP@ssw0rd123';

  await postJson('/api/auth/register', {
    name: 'New User',
    email,
    mobile,
    password,
    aadhaar: '999988887777',
  });

  const loginRes = await postJson('/api/auth/login', {
    email,
    password,
  });

  expect(loginRes.status).toBe(200);
  expect(loginRes.json?.message).toContain('mfa setup required');
  expect(loginRes.json?.tempToken).toBeTruthy();
});
