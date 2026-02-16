"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const security_1 = require("../src/lib/security");
(0, globals_1.describe)('security utilities', () => {
    (0, globals_1.describe)('isValidEmail', () => {
        (0, globals_1.it)('should accept valid email', () => {
            (0, globals_1.expect)((0, security_1.isValidEmail)('user@example.com')).toBe(true);
            (0, globals_1.expect)((0, security_1.isValidEmail)('test.user@domain.co.in')).toBe(true);
        });
        (0, globals_1.it)('should reject invalid email', () => {
            (0, globals_1.expect)((0, security_1.isValidEmail)('notanemail')).toBe(false);
            (0, globals_1.expect)((0, security_1.isValidEmail)('@example.com')).toBe(false);
            (0, globals_1.expect)((0, security_1.isValidEmail)('user@')).toBe(false);
        });
    });
    (0, globals_1.describe)('isValidMobile', () => {
        (0, globals_1.it)('should accept valid indian mobile', () => {
            (0, globals_1.expect)((0, security_1.isValidMobile)('9876543210')).toBe(true);
            (0, globals_1.expect)((0, security_1.isValidMobile)('8123456789')).toBe(true);
            (0, globals_1.expect)((0, security_1.isValidMobile)('+919876543210')).toBe(true);
        });
        (0, globals_1.it)('should reject invalid mobile', () => {
            (0, globals_1.expect)((0, security_1.isValidMobile)('1234567890')).toBe(false);
            (0, globals_1.expect)((0, security_1.isValidMobile)('12345')).toBe(false);
            (0, globals_1.expect)((0, security_1.isValidMobile)('abcdefghij')).toBe(false);
        });
    });
    (0, globals_1.describe)('normalizeMobile', () => {
        (0, globals_1.it)('should normalize mobile number', () => {
            (0, globals_1.expect)((0, security_1.normalizeMobile)('+919876543210')).toBe('9876543210');
            (0, globals_1.expect)((0, security_1.normalizeMobile)('919876543210')).toBe('9876543210');
            (0, globals_1.expect)((0, security_1.normalizeMobile)('09876543210')).toBe('9876543210');
            (0, globals_1.expect)((0, security_1.normalizeMobile)('9876543210')).toBe('9876543210');
        });
    });
    (0, globals_1.describe)('sanitizeInput', () => {
        (0, globals_1.it)('should remove dangerous characters', () => {
            (0, globals_1.expect)((0, security_1.sanitizeInput)('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
            (0, globals_1.expect)((0, security_1.sanitizeInput)('javascript:alert(1)')).toBe('alert(1)');
            (0, globals_1.expect)((0, security_1.sanitizeInput)('onclick=alert(1)')).toBe('alert(1)');
        });
        (0, globals_1.it)('should trim whitespace', () => {
            (0, globals_1.expect)((0, security_1.sanitizeInput)('  test  ')).toBe('test');
        });
        (0, globals_1.it)('should preserve safe content', () => {
            (0, globals_1.expect)((0, security_1.sanitizeInput)('John Doe')).toBe('John Doe');
            (0, globals_1.expect)((0, security_1.sanitizeInput)('test@example.com')).toBe('test@example.com');
        });
    });
});
//# sourceMappingURL=security.test.js.map