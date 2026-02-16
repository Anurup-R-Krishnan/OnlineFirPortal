"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bun_test_1 = require("bun:test");
const prisma_1 = require("../src/lib/prisma");
const jwt_1 = require("../src/lib/jwt");
const utils_1 = require("./utils");
// Ensure we use the same secret as the server
process.env.JWT_SECRET = 'test-jwt-secret';
let baseUrl = '';
(0, bun_test_1.beforeAll)(async () => {
    // Start server first
    const server = await (0, utils_1.startTestServer)();
    baseUrl = server.baseUrl;
});
(0, bun_test_1.afterAll)(async () => {
    await (0, utils_1.stopTestServer)();
});
(0, bun_test_1.beforeEach)(async () => {
    await (0, utils_1.cleanDatabase)();
});
(0, bun_test_1.test)('GET /stats returns correct counts for citizen', async () => {
    // 1. Create Citizen
    const citizen = await prisma_1.prisma.user.create({
        data: {
            name: 'Stats User',
            email: 'stats@test.com',
            mobile: '5555555555',
            role: 'CITIZEN',
            passwordHash: 'hash',
            passwordSalt: 'salt',
            mfaEnabled: true
        }
    });
    // 2. Generate Token
    const token = (0, jwt_1.generateAccessToken)({
        userId: citizen.id,
        email: citizen.email,
        role: citizen.role,
        mfaVerified: true,
        name: citizen.name
    });
    // 3. Create FIRs
    // 1 Draft
    await prisma_1.prisma.fIR.create({
        data: {
            reporterId: citizen.id,
            referenceNumber: 'FIR001',
            title: 'Draft FIR',
            crimeType: 'Theft',
            description: 'Draft',
            incidentDate: new Date(),
            incidentTime: '10:00',
            incidentPlace: 'Home',
            status: 'DRAFT',
            encryptedData: 'enc'
        }
    });
    // 2 Submitted
    await prisma_1.prisma.fIR.create({
        data: {
            reporterId: citizen.id,
            referenceNumber: 'FIR002',
            title: 'Submitted FIR 1',
            crimeType: 'Theft',
            description: 'Submitted',
            incidentDate: new Date(),
            incidentTime: '10:00',
            incidentPlace: 'Home',
            status: 'SUBMITTED',
            encryptedData: 'enc'
        }
    });
    await prisma_1.prisma.fIR.create({
        data: {
            reporterId: citizen.id,
            referenceNumber: 'FIR003',
            title: 'Submitted FIR 2',
            crimeType: 'Theft',
            description: 'Submitted',
            incidentDate: new Date(),
            incidentTime: '10:00',
            incidentPlace: 'Home',
            status: 'SUBMITTED',
            encryptedData: 'enc'
        }
    });
    // 1 Closed
    await prisma_1.prisma.fIR.create({
        data: {
            reporterId: citizen.id,
            referenceNumber: 'FIR004',
            title: 'Closed FIR',
            crimeType: 'Theft',
            description: 'Closed',
            incidentDate: new Date(),
            incidentTime: '10:00',
            incidentPlace: 'Home',
            status: 'CLOSED',
            encryptedData: 'enc'
        }
    });
    // 4. Call Stats Endpoint
    const res = await fetch(`${baseUrl}/api/firs/stats`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    (0, bun_test_1.expect)(res.status).toBe(200);
    const stats = await res.json();
    // 5. Verify
    // The endpoint logic:
    // SUBMITTED -> pending
    // UNDER_INVESTIGATION -> investigation + assigned
    // CLOSED/REJECTED -> closed
    (0, bun_test_1.expect)(stats.total).toBe(4); // Drafts ARE counted
    (0, bun_test_1.expect)(stats.pending).toBe(2);
    (0, bun_test_1.expect)(stats.closed).toBe(1);
    (0, bun_test_1.expect)(stats.investigation).toBe(0);
    (0, bun_test_1.expect)(stats.total).toBe(4);
});
//# sourceMappingURL=stats.test.js.map