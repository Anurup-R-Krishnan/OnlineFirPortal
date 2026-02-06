import { describe, it, expect, beforeAll } from '@jest/globals';
import {
    validatePasswordStrength,
    checkPasswordHistory,
    updatePasswordHistory,
} from '../src/lib/password-service';

describe('password service', () => {
    describe('validatePasswordStrength', () => {
        it('should accept strong password', () => {
            const result = validatePasswordStrength('SecureP@ssw0rd123');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject short password', () => {
            const result = validatePasswordStrength('Short1!');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('password must be at least 12 characters long');
        });

        it('should reject password without uppercase', () => {
            const result = validatePasswordStrength('nouppercase1!');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('password must contain at least one uppercase letter');
        });

        it('should reject password without lowercase', () => {
            const result = validatePasswordStrength('NOLOWERCASE1!');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('password must contain at least one lowercase letter');
        });

        it('should reject password without number', () => {
            const result = validatePasswordStrength('NoNumberHere!');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('password must contain at least one number');
        });

        it('should reject password without special character', () => {
            const result = validatePasswordStrength('NoSpecialChar1');
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('password must contain at least one special character');
        });
    });

    describe('checkPasswordHistory', () => {
        it('should allow new password when no history', () => {
            const result = checkPasswordHistory('newhash');
            expect(result).toBe(true);
        });

        it('should reject password in history', () => {
            const history = JSON.stringify(['hash1', 'hash2', 'hash3']);
            const result = checkPasswordHistory('hash2', history);
            expect(result).toBe(false);
        });

        it('should allow password not in history', () => {
            const history = JSON.stringify(['hash1', 'hash2', 'hash3']);
            const result = checkPasswordHistory('hash4', history);
            expect(result).toBe(true);
        });
    });

    describe('updatePasswordHistory', () => {
        it('should create new history', () => {
            const result = updatePasswordHistory('hash1');
            const history = JSON.parse(result);
            expect(history).toHaveLength(1);
            expect(history[0]).toBe('hash1');
        });

        it('should prepend to existing history', () => {
            const existing = JSON.stringify(['hash1', 'hash2']);
            const result = updatePasswordHistory('hash3', existing);
            const history = JSON.parse(result);
            expect(history).toHaveLength(3);
            expect(history[0]).toBe('hash3');
        });

        it('should limit history to 5 entries', () => {
            const existing = JSON.stringify(['hash1', 'hash2', 'hash3', 'hash4', 'hash5']);
            const result = updatePasswordHistory('hash6', existing);
            const history = JSON.parse(result);
            expect(history).toHaveLength(5);
            expect(history[0]).toBe('hash6');
            expect(history.includes('hash5')).toBe(false);
        });
    });
});
