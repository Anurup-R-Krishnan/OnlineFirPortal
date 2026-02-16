"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bun_test_1 = require("bun:test");
const utils_1 = require("./utils");
function randomMobile() {
    return `9${Math.floor(100000000 + Math.random() * 900000000)}`;
}
let baseUrl = '';
(0, bun_test_1.beforeAll)(async () => {
    const server = await (0, utils_1.startTestServer)();
    baseUrl = server.baseUrl;
});
(0, bun_test_1.afterAll)(async () => {
    await (0, utils_1.stopTestServer)();
});
(0, bun_test_1.beforeEach)(async () => {
    await (0, utils_1.cleanDatabase)();
});
async function postJson(path, body) {
    const res = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, json };
}
(0, bun_test_1.test)('register citizen and setup mfa', async () => {
    const email = (0, utils_1.uniqueEmail)('citizen');
    const mobile = randomMobile();
    const password = 'SecureP@ssw0rd123';
    const registerRes = await postJson('/api/auth/register', {
        name: 'Test Citizen',
        email,
        mobile,
        password,
        aadhaar: '123412341234',
    });
    (0, bun_test_1.expect)(registerRes.status).toBe(201);
    (0, bun_test_1.expect)(registerRes.json?.success).toBe(true);
    (0, bun_test_1.expect)(registerRes.json?.message).toContain('mfa');
    (0, bun_test_1.expect)(registerRes.json?.userId).toBeTruthy();
});
(0, bun_test_1.test)('login requires mfa setup for new users', async () => {
    const email = (0, utils_1.uniqueEmail)('newuser');
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
    (0, bun_test_1.expect)(loginRes.status).toBe(200);
    (0, bun_test_1.expect)(loginRes.json?.message).toContain('mfa setup required');
    (0, bun_test_1.expect)(loginRes.json?.tempToken).toBeTruthy();
});
//# sourceMappingURL=auth.test.js.map