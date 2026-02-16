"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRateLimit = checkRateLimit;
exports.trackFailedLogin = trackFailedLogin;
exports.resetFailedLoginAttempts = resetFailedLoginAttempts;
exports.isAccountLocked = isAccountLocked;
exports.unlockAccount = unlockAccount;
exports.sanitizeInput = sanitizeInput;
exports.isValidEmail = isValidEmail;
exports.isValidMobile = isValidMobile;
exports.normalizeMobile = normalizeMobile;
exports.generateSecureToken = generateSecureToken;
exports.cleanupRateLimits = cleanupRateLimits;
exports.encodeBase64 = encodeBase64;
exports.decodeBase64 = decodeBase64;
exports.generateSalt = generateSalt;
exports.hashWithSalt = hashWithSalt;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.encryptAES = encryptAES;
exports.decryptAES = decryptAES;
exports.generateRSAKeyPair = generateRSAKeyPair;
exports.encryptRSA = encryptRSA;
exports.decryptRSA = decryptRSA;
exports.generateRSASigningKeyPair = generateRSASigningKeyPair;
exports.signData = signData;
exports.verifySignature = verifySignature;
exports.generateFIRNumber = generateFIRNumber;
exports.encryptData = encryptData;
exports.decryptData = decryptData;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = require("crypto");
const prisma_1 = require("./prisma");
const audit_logger_1 = require("./audit-logger");
const crypto = (globalThis.crypto || crypto_1.webcrypto);
__exportStar(require("./access-control"), exports);
const rateLimitStore = new Map();
const loginAttemptStore = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 100;
const LOGIN_ATTEMPT_WINDOW = 30 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const ACCOUNT_LOCKOUT_DURATION = 30 * 60 * 1000;
function checkRateLimit(ipAddress) {
    const now = Date.now();
    const key = `rate:${ipAddress}`;
    const record = rateLimitStore.get(key);
    if (!record || record.resetAt < now) {
        rateLimitStore.set(key, {
            count: 1,
            resetAt: now + RATE_LIMIT_WINDOW,
        });
        return true;
    }
    if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
        return false;
    }
    record.count++;
    rateLimitStore.set(key, record);
    return true;
}
async function trackFailedLogin(userId, email, ipAddress, userAgent) {
    const user = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: {
            failedLoginAttempts: { increment: 1 },
        },
    });
    await (0, audit_logger_1.logAuthAttempt)(email, false, ipAddress, userAgent, 'invalid credentials');
    const attemptsRemaining = MAX_LOGIN_ATTEMPTS - user.failedLoginAttempts;
    if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + ACCOUNT_LOCKOUT_DURATION);
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                accountStatus: 'LOCKED',
                lockedUntil,
            },
        });
        return { locked: true, attemptsRemaining: 0 };
    }
    return { locked: false, attemptsRemaining };
}
async function resetFailedLoginAttempts(userId) {
    await prisma_1.prisma.user.update({
        where: { id: userId },
        data: {
            failedLoginAttempts: 0,
            lastLoginAt: new Date(),
        },
    });
}
async function isAccountLocked(userId) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { accountStatus: true, lockedUntil: true },
    });
    if (!user)
        return false;
    if (user.accountStatus === 'LOCKED') {
        if (user.lockedUntil && user.lockedUntil < new Date()) {
            await prisma_1.prisma.user.update({
                where: { id: userId },
                data: {
                    accountStatus: 'ACTIVE',
                    lockedUntil: null,
                    failedLoginAttempts: 0,
                },
            });
            return false;
        }
        return true;
    }
    return false;
}
async function unlockAccount(userId, adminId) {
    await prisma_1.prisma.user.update({
        where: { id: userId },
        data: {
            accountStatus: 'ACTIVE',
            lockedUntil: null,
            failedLoginAttempts: 0,
        },
    });
}
function sanitizeInput(input) {
    return input
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .trim();
}
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function isValidMobile(mobile) {
    const normalized = mobile.replace(/\s+/g, '').replace(/^\+?91/, '').replace(/^0+/, '');
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(normalized);
}
function normalizeMobile(mobile) {
    return mobile.replace(/\s+/g, '').replace(/^\+?91/, '').replace(/^0+/, '');
}
function generateSecureToken(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, byte => chars[byte % chars.length]).join('');
}
function cleanupRateLimits() {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
        if (record.resetAt < now) {
            rateLimitStore.delete(key);
        }
    }
    for (const [key, record] of loginAttemptStore.entries()) {
        if (record.resetAt < now) {
            loginAttemptStore.delete(key);
        }
    }
}
const cleanupInterval = setInterval(cleanupRateLimits, 5 * 60 * 1000);
cleanupInterval.unref();
function encodeBase64(data) {
    return btoa(unescape(encodeURIComponent(data)));
}
function decodeBase64(encoded) {
    return decodeURIComponent(escape(atob(encoded)));
}
async function generateSalt(length = 16) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
async function hashWithSalt(data, salt) {
    const encoder = new TextEncoder();
    const dataWithSalt = encoder.encode(data + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataWithSalt);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}
async function hashPassword(password) {
    const salt = await bcryptjs_1.default.genSalt(10);
    const hash = await bcryptjs_1.default.hash(password, salt);
    return { hash, salt };
}
async function verifyPassword(password, storedHash, salt) {
    return await bcryptjs_1.default.compare(password, storedHash);
}
async function deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({
        name: 'PBKDF2',
        salt: salt.buffer,
        iterations: 100000,
        hash: 'SHA-256'
    }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function encryptAES(plaintext, password) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, encoder.encode(plaintext));
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);
    return btoa(String.fromCharCode(...combined));
}
async function decryptAES(ciphertext, password) {
    const combined = new Uint8Array(atob(ciphertext).split('').map(c => c.charCodeAt(0)));
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);
    const key = await deriveKey(password, salt);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, encrypted);
    return new TextDecoder().decode(decrypted);
}
async function generateRSAKeyPair() {
    const encryptionKeyPair = await crypto.subtle.generateKey({
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
    }, true, ['encrypt', 'decrypt']);
    const publicKey = await crypto.subtle.exportKey('spki', encryptionKeyPair.publicKey);
    const privateKey = await crypto.subtle.exportKey('pkcs8', encryptionKeyPair.privateKey);
    return {
        publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKey))),
        privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKey)))
    };
}
async function encryptRSA(data, publicKeyBase64) {
    const encoder = new TextEncoder();
    const publicKeyBuffer = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));
    const publicKey = await crypto.subtle.importKey('spki', publicKeyBuffer, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);
    const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, encoder.encode(data));
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}
async function decryptRSA(encryptedBase64, privateKeyBase64) {
    const privateKeyBuffer = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0));
    const encryptedBuffer = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    const privateKey = await crypto.subtle.importKey('pkcs8', privateKeyBuffer, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt']);
    const decrypted = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, encryptedBuffer);
    return new TextDecoder().decode(decrypted);
}
async function generateRSASigningKeyPair() {
    const keyPair = await crypto.subtle.generateKey({
        name: 'RSA-PSS',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
    }, true, ['sign', 'verify']);
    const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    return {
        publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKey))),
        privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKey)))
    };
}
async function signData(data, privateKeyBase64) {
    const encoder = new TextEncoder();
    const privateKeyBuffer = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0));
    const privateKey = await crypto.subtle.importKey('pkcs8', privateKeyBuffer, { name: 'RSA-PSS', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign({ name: 'RSA-PSS', saltLength: 32 }, privateKey, encoder.encode(data));
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
}
async function verifySignature(data, signatureBase64, publicKeyBase64) {
    const encoder = new TextEncoder();
    const publicKeyBuffer = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));
    const signatureBuffer = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));
    const publicKey = await crypto.subtle.importKey('spki', publicKeyBuffer, { name: 'RSA-PSS', hash: 'SHA-256' }, false, ['verify']);
    return crypto.subtle.verify({ name: 'RSA-PSS', saltLength: 32 }, publicKey, signatureBuffer, encoder.encode(data));
}
function generateFIRNumber(stateCode = 'IN') {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return `FIR-${year}-${stateCode}-${random}`;
}
let warnedDefaultEncKey = false;
function ensureEncryptionKey() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('ENCRYPTION_KEY is required in production environment');
        }
        if (!warnedDefaultEncKey) {
            console.warn('[security] Using default ENCRYPTION_KEY. Set ENCRYPTION_KEY in .env for better security.');
            warnedDefaultEncKey = true;
        }
        return 'default-encryption-key-change-in-production';
    }
    return key;
}
async function encryptData(data) {
    const key = ensureEncryptionKey();
    return await encryptAES(data, key);
}
async function decryptData(encryptedData) {
    const key = ensureEncryptionKey();
    return await decryptAES(encryptedData, key);
}
//# sourceMappingURL=security.js.map