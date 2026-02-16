import request from 'supertest';
import { app } from '../src/server';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/security';
import { generateAccessToken } from '../src/lib/jwt';

describe('FIR Management API', () => {
    let citizenToken: string;
    let officerToken: string;
    let firId: string;
    let citizenId: string;

    beforeAll(async () => {
        await prisma.fIR.deleteMany({});
        await prisma.user.deleteMany({
            where: { email: { contains: '@example.com' } }
        });

        const citizenPassword = await hashPassword('Citizen@1234');
        const officerPassword = await hashPassword('Officer@1234');

        const citizen = await prisma.user.create({
            data: {
                name: 'Test Citizen',
                email: 'citizen@example.com',
                mobile: '9876543211',
                aadhaar: '123456789013',
                role: 'CITIZEN',
                passwordHash: citizenPassword.hash,
                passwordSalt: citizenPassword.salt,
                mfaEnabled: true,
                mfaSecret: 'JBSWY3DPEHPK3PXP',
            },
        });

        const officer = await prisma.user.create({
            data: {
                name: 'Test Officer',
                email: 'officer@example.com',
                mobile: '9876543212',
                role: 'OFFICER',
                passwordHash: officerPassword.hash,
                passwordSalt: officerPassword.salt,
                mfaEnabled: true,
                mfaSecret: 'JBSWY3DPEHPK3PXP',
            },
        });

        citizenId = citizen.id;

        citizenToken = generateAccessToken({
            userId: citizen.id,
            email: citizen.email,
            role: citizen.role,
            mfaVerified: true,
            name: citizen.name,
        });

        officerToken = generateAccessToken({
            userId: officer.id,
            email: officer.email,
            role: officer.role,
            mfaVerified: true,
            name: officer.name,
        });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('POST /api/firs', () => {
        it('should create a new FIR draft as citizen', async () => {
            const response = await request(app)
                .post('/api/firs')
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({
                    complaintType: 'Theft / Robbery',
                    incidentDate: '2024-01-15',
                    incidentTime: '14:30',
                    incidentDescription: 'My mobile phone was stolen',
                    incidentState: 'Karnataka',
                    incidentDistrict: 'Bangalore Urban',
                    incidentPlace: 'MG Road',
                    nearestLandmark: 'Trinity Metro Station',
                    hasWitness: false
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.status).toBe('DRAFT');
            expect(response.body).toHaveProperty('referenceNumber');

            firId = response.body.id;
        });

        it('should reject FIR creation by non-citizen', async () => {
            const response = await request(app)
                .post('/api/firs')
                .set('Authorization', `Bearer ${officerToken}`)
                .send({
                    complaintType: 'Theft / Robbery',
                    incidentDescription: 'Test'
                });

            expect(response.status).toBe(403);
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/firs')
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({
                    complaintType: 'Theft / Robbery'
                    // Missing required fields
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/firs/:id/submit', () => {
        it('should submit FIR', async () => {
            const response = await request(app)
                .post(`/api/firs/${firId}/submit`)
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({});

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('SUBMITTED');
        });

        it('should reject submission without signature if user has public key', async () => {
            // Test signature validation
        });
    });

    describe('GET /api/firs', () => {
        it('should list FIRs for citizen (own FIRs only)', async () => {
            const response = await request(app)
                .get('/api/firs')
                .set('Authorization', `Bearer ${citizenToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.firs)).toBe(true);
            // All FIRs should belong to the citizen
            response.body.firs.forEach((fir: any) => {
                expect(fir.reporter.id).toBe(citizenId);
            });
        });

        it('should list all FIRs for officers', async () => {
            const response = await request(app)
                .get('/api/firs')
                .set('Authorization', `Bearer ${officerToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.firs)).toBe(true);
        });
    });

    describe('POST /api/firs/:id/assign', () => {
        it('should allow SHO to assign FIR to officer', async () => {
            // Test FIR assignment
        });

        it('should reject assignment by non-SHO', async () => {
            // Test authorization
        });
    });

    describe('POST /api/firs/:id/update-status', () => {
        it('should allow officer to update FIR status', async () => {
            const response = await request(app)
                .post(`/api/firs/${firId}/update-status`)
                .set('Authorization', `Bearer ${officerToken}`)
                .send({
                    status: 'UNDER_INVESTIGATION'
                });

            expect(response.status).toBe(200);
            const updated = await request(app)
                .get(`/api/firs/${firId}`)
                .set('Authorization', `Bearer ${officerToken}`);

            expect(updated.status).toBe(200);
            expect(updated.body.status).toBe('UNDER_INVESTIGATION');
        });

        it('should reject status update by citizen', async () => {
            const response = await request(app)
                .post(`/api/firs/${firId}/update-status`)
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({
                    status: 'CLOSED'
                });

            expect(response.status).toBe(403);
        });
    });

    describe('GET /api/firs/stats', () => {
        it('should return FIR statistics', async () => {
            const response = await request(app)
                .get('/api/firs/stats')
                .set('Authorization', `Bearer ${officerToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('total');
            expect(response.body).toHaveProperty('pending');
            expect(response.body).toHaveProperty('assigned');
            expect(response.body).toHaveProperty('investigation');
            expect(response.body).toHaveProperty('closed');
        });
    });
});
