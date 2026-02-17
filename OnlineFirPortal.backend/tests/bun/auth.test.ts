import { test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import speakeasy from 'speakeasy';
import {
  uniqueEmail,
  startTestServer,
  stopTestServer,
  cleanDatabase
} from './utils';

function randomMobile() {
  return `9${Math.floor(100000000 + Math.random() * 900000000)}`;
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

async function postJson(path: string, body: Record<string, any>) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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

test('register citizen and setup mfa', async () => {
  const email = uniqueEmail('citizen');
  const mobile = randomMobile();
  const password = 'SecureP@ssw0rd123';

  const registerRes = await registerCitizenWithMfa({
    name: 'Test Citizen',
    email,
    mobile,
    password,
    aadhaar: randomAadhaar(),
  });

  expect(registerRes.status).toBe(201);
  expect(registerRes.json?.success).toBe(true);
  expect(registerRes.json?.message).toContain('mfa');
  expect(registerRes.json?.userId).toBeTruthy();
});

test('login requires totp for mfa-enabled users', async () => {
  const email = uniqueEmail('newuser');
  const mobile = randomMobile();
  const password = 'SecureP@ssw0rd123';

  const registerRes = await registerCitizenWithMfa({
    name: 'New User',
    email,
    mobile,
    password,
    aadhaar: randomAadhaar(),
  });
  expect(registerRes.status).toBe(201);

  const loginRes = await postJson('/api/auth/login', {
    email,
    password,
  });

  expect(loginRes.status).toBe(200);
  expect(loginRes.json?.message).toContain('totp');
  expect(loginRes.json?.requiresMfa).toBe(true);
  expect(loginRes.json?.tempToken).toBeTruthy();
});
