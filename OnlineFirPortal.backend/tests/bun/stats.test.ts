import { test, expect, beforeAll, afterAll } from "bun:test";
import speakeasy from 'speakeasy';
import { uniqueEmail, startTestServer, stopTestServer } from './utils';

let baseUrl = '';

beforeAll(async () => {
  const server = await startTestServer();
  baseUrl = server.baseUrl;
});

afterAll(async () => {
  await stopTestServer();
});

async function postJson(path: string, body: Record<string, any>, token?: string) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

test('GET /stats returns counts for authenticated citizen', async () => {
  const email = uniqueEmail('stats');
  const password = 'SecureP@ssw0rd123';
  const mobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

  const setupRes = await postJson('/api/auth/setup-mfa-registration', { email });
  expect(setupRes.status).toBe(200);
  expect(setupRes.json?.secret).toBeTruthy();

  const totp = speakeasy.totp({
    secret: setupRes.json.secret,
    encoding: 'base32',
  });

  const registerRes = await postJson('/api/auth/register', {
    name: 'Stats User',
    email,
    mobile,
    password,
    aadhaar,
    mfaSecret: setupRes.json.secret,
    totp,
  });
  expect(registerRes.status).toBe(201);

  const loginRes = await postJson('/api/auth/login', { email, password });
  expect(loginRes.status).toBe(200);
  expect(loginRes.json?.tempToken).toBeTruthy();

  const verifyRes = await postJson('/api/auth/verify-totp', {
    tempToken: loginRes.json.tempToken,
    totp: speakeasy.totp({ secret: setupRes.json.secret, encoding: 'base32' }),
  });
  expect(verifyRes.status).toBe(200);
  expect(verifyRes.json?.accessToken).toBeTruthy();

  const statsRes = await fetch(`${baseUrl}/api/firs/stats`, {
    headers: {
      Authorization: `Bearer ${verifyRes.json.accessToken}`,
    },
  });
  expect(statsRes.status).toBe(200);
  const stats = await statsRes.json();

  expect(typeof stats.total).toBe('number');
  expect(typeof stats.pending).toBe('number');
  expect(typeof stats.assigned).toBe('number');
  expect(typeof stats.investigation).toBe('number');
  expect(typeof stats.closed).toBe('number');
});
  const aadhaar = `${Math.floor(100000000000 + Math.random() * 900000000000)}`;
