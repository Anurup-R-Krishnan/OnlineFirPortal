"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bun_test_1 = require("bun:test");
const utils_1 = require("./utils");
function randomMobile() {
    return `8${Math.floor(100000000 + Math.random() * 900000000)}`;
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
async function postJson(path, body, token) {
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
async function getJson(path, token) {
    const res = await fetch(`${baseUrl}${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, json };
}
(0, bun_test_1.test)('rejects fir access without token', async () => {
    const res = await getJson('/api/firs');
    (0, bun_test_1.expect)(res.status).toBe(401);
});
(0, bun_test_1.test)('citizen can register for fir portal', async () => {
    const email = (0, utils_1.uniqueEmail)('fircitizen');
    const mobile = randomMobile();
    const password = 'SecureP@ssw0rd123';
    const registerRes = await postJson('/api/auth/register', {
        name: 'FIR Citizen',
        email,
        mobile,
        password,
        aadhaar: '555544443333',
    });
    (0, bun_test_1.expect)(registerRes.status).toBe(201);
    (0, bun_test_1.expect)(registerRes.json?.success).toBe(true);
    (0, bun_test_1.expect)(registerRes.json?.userId).toBeTruthy();
});
//# sourceMappingURL=fir.test.js.map