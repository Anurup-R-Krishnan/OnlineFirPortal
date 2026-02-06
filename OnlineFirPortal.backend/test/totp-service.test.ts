import { describe, it, expect } from '@jest/globals';
import { generateTOTPSecret, verifyTOTP, generateRecoveryCodes } from '../src/lib/totp-service';

describe('totp service', () => {
    describe('generateTOTPSecret', () => {
        it('should generate totp secret and qr code', async () => {
            const result = await generateTOTPSecret('test@example.com');

            expect(result.secret).toBeDefined();
            expect(result.secret.length).toBeGreaterThan(0);
            expect(result.qrCode).toBeDefined();
            expect(result.qrCode).toContain('data:image/png;base64');
            expect(result.manualEntryKey).toBe(result.secret);
        });
    });

    describe('verifyTOTP', () => {
        it('should verify valid totp token', async () => {
            const speakeasy = require('speakeasy');
            const secret = speakeasy.generateSecret();
            const token = speakeasy.totp({
                secret: secret.base32,
                encoding: 'base32',
            });

            const result = verifyTOTP(token, secret.base32);
            expect(result).toBe(true);
        });

        it('should reject invalid totp token', async () => {
            const speakeasy = require('speakeasy');
            const secret = speakeasy.generateSecret();

            const result = verifyTOTP('000000', secret.base32);
            expect(result).toBe(false);
        });
    });

    describe('generateRecoveryCodes', () => {
        it('should generate 10 recovery codes', () => {
            const codes = generateRecoveryCodes();
            expect(codes).toHaveLength(10);
        });

        it('should generate unique codes', () => {
            const codes = generateRecoveryCodes();
            const uniqueCodes = new Set(codes);
            expect(uniqueCodes.size).toBe(10);
        });

        it('should generate uppercase alphanumeric codes', () => {
            const codes = generateRecoveryCodes();
            codes.forEach(code => {
                expect(code).toMatch(/^[A-Z0-9]+$/);
            });
        });
    });
});
