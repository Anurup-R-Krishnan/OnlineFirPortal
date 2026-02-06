import { describe, it, expect } from '@jest/globals';
import {
    isValidEmail,
    isValidMobile,
    normalizeMobile,
    sanitizeInput,
} from '../src/lib/security';

describe('security utilities', () => {
    describe('isValidEmail', () => {
        it('should accept valid email', () => {
            expect(isValidEmail('user@example.com')).toBe(true);
            expect(isValidEmail('test.user@domain.co.in')).toBe(true);
        });

        it('should reject invalid email', () => {
            expect(isValidEmail('notanemail')).toBe(false);
            expect(isValidEmail('@example.com')).toBe(false);
            expect(isValidEmail('user@')).toBe(false);
        });
    });

    describe('isValidMobile', () => {
        it('should accept valid indian mobile', () => {
            expect(isValidMobile('9876543210')).toBe(true);
            expect(isValidMobile('8123456789')).toBe(true);
            expect(isValidMobile('+919876543210')).toBe(true);
        });

        it('should reject invalid mobile', () => {
            expect(isValidMobile('1234567890')).toBe(false);
            expect(isValidMobile('12345')).toBe(false);
            expect(isValidMobile('abcdefghij')).toBe(false);
        });
    });

    describe('normalizeMobile', () => {
        it('should normalize mobile number', () => {
            expect(normalizeMobile('+919876543210')).toBe('9876543210');
            expect(normalizeMobile('919876543210')).toBe('9876543210');
            expect(normalizeMobile('09876543210')).toBe('9876543210');
            expect(normalizeMobile('9876543210')).toBe('9876543210');
        });
    });

    describe('sanitizeInput', () => {
        it('should remove dangerous characters', () => {
            expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
            expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
            expect(sanitizeInput('onclick=alert(1)')).toBe('alert(1)');
        });

        it('should trim whitespace', () => {
            expect(sanitizeInput('  test  ')).toBe('test');
        });

        it('should preserve safe content', () => {
            expect(sanitizeInput('John Doe')).toBe('John Doe');
            expect(sanitizeInput('test@example.com')).toBe('test@example.com');
        });
    });
});
