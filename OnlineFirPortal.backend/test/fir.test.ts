import fs from 'fs';
import {
  TEST_DB_PATH,
  uniqueEmail,
  startTestServer,
  stopTestServer
} from './utils';

function randomMobile() {
  return `8${Math.floor(100000000 + Math.random() * 900000000)}`;
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
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

test('rejects FIR access without token', async () => {
  const res = await getJson('/api/firs');
  expect(res.status).toBe(401);
});

test('create FIR with authenticated citizen', async () => {
  const email = uniqueEmail('fir');
  const mobile = randomMobile();
  const password = 'Password123!';

  const registerRes = await postJson('/api/auth/register', {
    name: 'FIR Citizen',
    email,
    mobile,
    password,
    aadhaar: '555544443333',
    role: 'citizen',
    mfaEnabled: false,
  });
  expect(registerRes.status).toBe(201);

  const loginRes = await postJson('/api/auth/login', { email, password });

  const token = loginRes.json?.accessToken;
  expect(token).toBeTruthy();

  const createRes = await postJson('/api/firs', {
    complaintType: 'Theft',
    incidentDate: '2025-12-01',
    incidentTime: '12:30',
    incidentDescription: 'Test FIR created by bun test',
    incidentState: 'Karnataka',
    incidentDistrict: 'Bengaluru',
    incidentPlace: 'MG Road',
    nearestLandmark: 'Metro Station',
    hasWitness: false,
    documents: [],
  }, token);

  expect(createRes.status).toBe(201);
  expect(createRes.json?.id).toBeTruthy();
  expect(createRes.json?.referenceNumber).toBeTruthy();

  const listRes = await getJson('/api/firs', token);

  expect(listRes.status).toBe(200);
  const list = listRes.json as any[];
  const found = list.some((fir) => fir.id === createRes.json.id);
  expect(found).toBe(true);
});
