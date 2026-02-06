
import { test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { prisma } from '../src/lib/prisma';
import { generateAccessToken } from '../src/lib/jwt';
import { startTestServer, stopTestServer, cleanDatabase } from './utils';
import { UserRole } from '@prisma/client';

// Ensure we use the same secret as the server
process.env.JWT_SECRET = 'test-jwt-secret';

let baseUrl = '';

beforeAll(async () => {
    // Start server first
    const server = await startTestServer();
    baseUrl = server.baseUrl;
});

afterAll(async () => {
    await stopTestServer();
});

beforeEach(async () => {
    await cleanDatabase();
});

test('GET /stats returns correct counts for citizen', async () => {
    // 1. Create Citizen
    const citizen = await prisma.user.create({
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
    const token = generateAccessToken({
        userId: citizen.id,
        email: citizen.email,
        role: citizen.role,
        mfaVerified: true,
        name: citizen.name
    });

    // 3. Create FIRs
    // 1 Draft
    await prisma.fIR.create({
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
    await prisma.fIR.create({
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

    await prisma.fIR.create({
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
    await prisma.fIR.create({
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

    expect(res.status).toBe(200);
    const stats = await res.json();

    // 5. Verify
    // The endpoint logic:
    // SUBMITTED -> pending
    // UNDER_INVESTIGATION -> investigation + assigned
    // CLOSED/REJECTED -> closed

    expect(stats.total).toBe(4); // Drafts ARE counted

    expect(stats.pending).toBe(2);
    expect(stats.closed).toBe(1);
    expect(stats.investigation).toBe(0);
    expect(stats.total).toBe(4);
});
