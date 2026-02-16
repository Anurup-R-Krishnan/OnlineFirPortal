"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const totp_service_1 = require("../src/lib/totp-service");
(0, globals_1.describe)('totp service', () => {
    (0, globals_1.describe)('generateTOTPSecret', () => {
        (0, globals_1.it)('should generate totp secret and qr code', async () => {
            const result = await (0, totp_service_1.generateTOTPSecret)('test@example.com');
            (0, globals_1.expect)(result.secret).toBeDefined();
            (0, globals_1.expect)(result.secret.length).toBeGreaterThan(0);
            (0, globals_1.expect)(result.qrCode).toBeDefined();
            (0, globals_1.expect)(result.qrCode).toContain('data:image/png;base64');
            (0, globals_1.expect)(result.manualEntryKey).toBe(result.secret);
        });
    });
    (0, globals_1.describe)('verifyTOTP', () => {
        (0, globals_1.it)('should verify valid totp token', async () => {
            const speakeasy = require('speakeasy');
            const secret = speakeasy.generateSecret();
            const token = speakeasy.totp({
                secret: secret.base32,
                encoding: 'base32',
            });
            const result = (0, totp_service_1.verifyTOTP)(token, secret.base32);
            (0, globals_1.expect)(result).toBe(true);
        });
        (0, globals_1.it)('should reject invalid totp token', async () => {
            const speakeasy = require('speakeasy');
            const secret = speakeasy.generateSecret();
            const result = (0, totp_service_1.verifyTOTP)('000000', secret.base32);
            (0, globals_1.expect)(result).toBe(false);
        });
    });
    (0, globals_1.describe)('generateRecoveryCodes', () => {
        (0, globals_1.it)('should generate 10 recovery codes', () => {
            const codes = (0, totp_service_1.generateRecoveryCodes)();
            (0, globals_1.expect)(codes).toHaveLength(10);
        });
        (0, globals_1.it)('should generate unique codes', () => {
            const codes = (0, totp_service_1.generateRecoveryCodes)();
            const uniqueCodes = new Set(codes);
            (0, globals_1.expect)(uniqueCodes.size).toBe(10);
        });
        (0, globals_1.it)('should generate uppercase alphanumeric codes', () => {
            const codes = (0, totp_service_1.generateRecoveryCodes)();
            codes.forEach(code => {
                (0, globals_1.expect)(code).toMatch(/^[A-Z0-9]+$/);
            });
        });
    });
});
//# sourceMappingURL=totp-service.test.js.map