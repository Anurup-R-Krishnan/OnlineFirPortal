"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const password_service_1 = require("../src/lib/password-service");
(0, globals_1.describe)('password service', () => {
    (0, globals_1.describe)('validatePasswordStrength', () => {
        (0, globals_1.it)('should accept strong password', () => {
            const result = (0, password_service_1.validatePasswordStrength)('SecureP@ssw0rd123');
            (0, globals_1.expect)(result.valid).toBe(true);
            (0, globals_1.expect)(result.errors).toHaveLength(0);
        });
        (0, globals_1.it)('should reject short password', () => {
            const result = (0, password_service_1.validatePasswordStrength)('Short1!');
            (0, globals_1.expect)(result.valid).toBe(false);
            (0, globals_1.expect)(result.errors).toContain('password must be at least 12 characters long');
        });
        (0, globals_1.it)('should reject password without uppercase', () => {
            const result = (0, password_service_1.validatePasswordStrength)('nouppercase1!');
            (0, globals_1.expect)(result.valid).toBe(false);
            (0, globals_1.expect)(result.errors).toContain('password must contain at least one uppercase letter');
        });
        (0, globals_1.it)('should reject password without lowercase', () => {
            const result = (0, password_service_1.validatePasswordStrength)('NOLOWERCASE1!');
            (0, globals_1.expect)(result.valid).toBe(false);
            (0, globals_1.expect)(result.errors).toContain('password must contain at least one lowercase letter');
        });
        (0, globals_1.it)('should reject password without number', () => {
            const result = (0, password_service_1.validatePasswordStrength)('NoNumberHere!');
            (0, globals_1.expect)(result.valid).toBe(false);
            (0, globals_1.expect)(result.errors).toContain('password must contain at least one number');
        });
        (0, globals_1.it)('should reject password without special character', () => {
            const result = (0, password_service_1.validatePasswordStrength)('NoSpecialChar1');
            (0, globals_1.expect)(result.valid).toBe(false);
            (0, globals_1.expect)(result.errors).toContain('password must contain at least one special character');
        });
    });
    (0, globals_1.describe)('checkPasswordHistory', () => {
        (0, globals_1.it)('should allow new password when no history', () => {
            const result = (0, password_service_1.checkPasswordHistory)('newhash');
            (0, globals_1.expect)(result).toBe(true);
        });
        (0, globals_1.it)('should reject password in history', () => {
            const history = JSON.stringify(['hash1', 'hash2', 'hash3']);
            const result = (0, password_service_1.checkPasswordHistory)('hash2', history);
            (0, globals_1.expect)(result).toBe(false);
        });
        (0, globals_1.it)('should allow password not in history', () => {
            const history = JSON.stringify(['hash1', 'hash2', 'hash3']);
            const result = (0, password_service_1.checkPasswordHistory)('hash4', history);
            (0, globals_1.expect)(result).toBe(true);
        });
    });
    (0, globals_1.describe)('updatePasswordHistory', () => {
        (0, globals_1.it)('should create new history', () => {
            const result = (0, password_service_1.updatePasswordHistory)('hash1');
            const history = JSON.parse(result);
            (0, globals_1.expect)(history).toHaveLength(1);
            (0, globals_1.expect)(history[0]).toBe('hash1');
        });
        (0, globals_1.it)('should prepend to existing history', () => {
            const existing = JSON.stringify(['hash1', 'hash2']);
            const result = (0, password_service_1.updatePasswordHistory)('hash3', existing);
            const history = JSON.parse(result);
            (0, globals_1.expect)(history).toHaveLength(3);
            (0, globals_1.expect)(history[0]).toBe('hash3');
        });
        (0, globals_1.it)('should limit history to 5 entries', () => {
            const existing = JSON.stringify(['hash1', 'hash2', 'hash3', 'hash4', 'hash5']);
            const result = (0, password_service_1.updatePasswordHistory)('hash6', existing);
            const history = JSON.parse(result);
            (0, globals_1.expect)(history).toHaveLength(5);
            (0, globals_1.expect)(history[0]).toBe('hash6');
            (0, globals_1.expect)(history.includes('hash5')).toBe(false);
        });
    });
});
//# sourceMappingURL=password-service.test.js.map