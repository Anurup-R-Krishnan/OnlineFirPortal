import request from 'supertest';
import speakeasy from 'speakeasy';
import { app } from '../../../src/server';
import { prisma } from '../../../src/lib/prisma';

const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    mobile: '9876543210',
    aadhaar: '123456789012',
    password: 'Test@1234567',
    mfaSecret: speakeasy.generateSecret({ length: 32 }).base32,
};

function generateTotp(secret: string) {
    return speakeasy.totp({ secret, encoding: 'base32' });
}

describe('Authentication API', () => {
    beforeAll(async () => {
        // Clean up test data
        await prisma.user.deleteMany({
            where: { email: { contains: 'test@' } }
        });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new citizen with valid data', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: testUser.name,
                    email: testUser.email,
                    mobile: testUser.mobile,
                    aadhaar: testUser.aadhaar,
                    password: testUser.password,
                    confirmPassword: testUser.password,
                    role: 'CITIZEN',
                    mfaSecret: testUser.mfaSecret,
                    totp: generateTotp(testUser.mfaSecret),
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe('test@example.com');
            expect(response.body).toHaveProperty('recoveryCodes');
            expect(response.body.recoveryCodes).toHaveLength(10);
        });

        it('should reject registration with weak password', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test2@example.com',
                    mobile: '9876543211',
                    aadhaar: '123456789013',
                    password: 'weak',
                    confirmPassword: 'weak',
                    role: 'CITIZEN',
                    mfaSecret: testUser.mfaSecret,
                    totp: generateTotp(testUser.mfaSecret)
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('password');
        });

        it('should reject duplicate email', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User 2',
                    email: testUser.email, // Duplicate
                    mobile: '9876543212',
                    aadhaar: '123456789014',
                    password: testUser.password,
                    confirmPassword: testUser.password,
                    role: 'CITIZEN',
                    mfaSecret: testUser.mfaSecret,
                    totp: generateTotp(testUser.mfaSecret)
                });

            expect(response.status).toBe(409);
            expect(response.body.error).toContain('already exists');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('tempToken');
            expect(response.body.requiresMfa).toBe(true);
        });

        it('should reject invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'WrongPassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.error).toContain('invalid');
        });

        it('should lock account after 5 failed attempts', async () => {
            // Make 5 failed login attempts
            for (let i = 0; i < 5; i++) {
                await request(app)
                    .post('/api/auth/login')
                    .send({
                        email: testUser.email,
                        password: 'WrongPassword'
                    });
            }

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(response.status).toBe(403);
            expect(response.body.error).toContain('locked');
        });
    });

    describe('POST /api/auth/verify-totp', () => {
        let tempToken: string;

        beforeAll(async () => {
            // Unlock the test account
            await prisma.user.update({
                where: { email: testUser.email },
                data: {
                    failedLoginAttempts: 0,
                    lockedUntil: null,
                    accountStatus: 'ACTIVE'
                }
            });
        });

        beforeEach(async () => {
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            tempToken = loginResponse.body.tempToken;
        });

        it('should verify valid TOTP and return access token', async () => {
            const response = await request(app)
                .post('/api/auth/verify-totp')
                .send({
                    tempToken,
                    totp: generateTotp(testUser.mfaSecret)
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('accessToken');
        });

        it('should reject invalid TOTP', async () => {
            const response = await request(app)
                .post('/api/auth/verify-totp')
                .send({
                    tempToken,
                    totp: '000000'
                });

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/auth/register-public-key', () => {
        let accessToken: string;

        beforeAll(async () => {
            // You'd need to complete MFA flow to get access token
            // For now, we'll skip this test or mock it
        });

        it('should register public key for digital signatures', async () => {
            // This requires a valid access token
            // Skip or mock for now
        });
    });
});
