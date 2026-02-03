import { test, expect, beforeAll, afterAll } from "bun:test";
import fs from 'fs';
import {
  TEST_DB_PATH,
  uniqueEmail,
  startTestServer,
  stopTestServer,
  waitForOtp
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
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
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

test('register and login without MFA', async () => {
  const email = uniqueEmail('nomfa');
  const mobile = randomMobile();
  const password = 'Password123!';

  const registerRes = await postJson('/api/auth/register', {
    name: 'No MFA User',
    email,
    mobile,
    password,
    aadhaar: '123412341234',
    role: 'citizen',
    mfaEnabled: false,
  });

  expect(registerRes.status).toBe(201);
  expect(registerRes.json?.success).toBe(true);

  const loginRes = await postJson('/api/auth/login', { email, password });

  expect(loginRes.status).toBe(200);
  expect(loginRes.json?.success).toBe(true);
  expect(loginRes.json?.accessToken).toBeTruthy();
});

test('register, login, and verify MFA via OTP', async () => {
  const email = uniqueEmail('mfa');
  const mobile = randomMobile();
  const password = 'Password123!';

  const registerRes = await postJson('/api/auth/register', {
    name: 'MFA User',
    email,
    mobile,
    password,
    aadhaar: '999988887777',
    role: 'citizen',
    mfaEnabled: true,
  });

  expect(registerRes.status).toBe(201);

  const loginRes = await postJson('/api/auth/login', { email, password });

  expect(loginRes.status).toBe(200);
  expect(loginRes.json?.mfaEnabled).toBe(true);
  expect(loginRes.json?.tempToken).toBeTruthy();

  const otp = await waitForOtp(email);
  expect(otp).toBeTruthy();

  const verifyRes = await postJson('/api/auth/verify-mfa', {
    tempToken: loginRes.json.tempToken,
    otp,
  });

  expect(verifyRes.status).toBe(200);
  expect(verifyRes.json?.success).toBe(true);
  expect(verifyRes.json?.accessToken).toBeTruthy();
});
