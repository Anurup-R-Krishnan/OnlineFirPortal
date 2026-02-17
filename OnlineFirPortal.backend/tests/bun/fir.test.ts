import { test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import speakeasy from 'speakeasy';
import {
  uniqueEmail,
  startTestServer,
  stopTestServer,
  cleanDatabase
} from './utils';

function randomMobile() {
  return `8${Math.floor(100000000 + Math.random() * 900000000)}`;
}

function randomAadhaar() {
  return `${Math.floor(100000000000 + Math.random() * 900000000000)}`;
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

async function postJson(path: string, body: Record<string, any>, token?: string) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function getJson(path: string, token?: string) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function registerCitizenWithMfa(params: {
  name: string;
  email: string;
  mobile: string;
  password: string;
  aadhaar: string;
}) {
  const setupRes = await postJson('/api/auth/setup-mfa-registration', { email: params.email });
  expect(setupRes.status).toBe(200);
  expect(setupRes.json?.secret).toBeTruthy();

  const totp = speakeasy.totp({
    secret: setupRes.json.secret,
    encoding: 'base32',
  });

  return postJson('/api/auth/register', {
    ...params,
    mfaSecret: setupRes.json.secret,
    totp,
  });
}

test('rejects fir access without token', async () => {
  const res = await getJson('/api/firs');
  expect(res.status).toBe(401);
});

test('citizen can register for fir portal', async () => {
  const email = uniqueEmail('fircitizen');
  const mobile = randomMobile();
  const password = 'SecureP@ssw0rd123';

  const registerRes = await registerCitizenWithMfa({
    name: 'FIR Citizen',
    email,
    mobile,
    password,
    aadhaar: randomAadhaar(),
  });

  expect(registerRes.status).toBe(201);
  expect(registerRes.json?.success).toBe(true);
  expect(registerRes.json?.userId).toBeTruthy();
});
