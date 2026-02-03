"use strict";
/**
 * Security Utilities for Online FIR Portal
 * Implements: Encryption (AES-256-GCM), Hashing (SHA-256 + Salt + bcrypt),
 * Digital Signatures (RSA-SHA256), and Encoding (Base64)
 */
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
exports.generateTOTPSecret = generateTOTPSecret;
exports.generateTOTP = generateTOTP;
exports.verifyTOTP = verifyTOTP;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = require("crypto");
// Polyfill for Node.js environment if global crypto is not available or partial
const crypto = (globalThis.crypto || crypto_1.webcrypto);
// Re-export access control utilities
__exportStar(require("./access-control"), exports);
// ============ ENCODING & DECODING (Base64) ============
function encodeBase64(data) {
    // Works in both browser and Node.js (Node 16+)
    return btoa(unescape(encodeURIComponent(data)));
}
function decodeBase64(encoded) {
    return decodeURIComponent(escape(atob(encoded)));
}
// ============ HASHING WITH SALT ============
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
// ============ PASSWORD HASHING WITH BCRYPT ============
// Using bcrypt for industry-standard password hashing with built-in salt
async function hashPassword(password) {
    const salt = await bcryptjs_1.default.genSalt(10);
    const hash = await bcryptjs_1.default.hash(password, salt);
    return { hash, salt };
}
async function verifyPassword(password, storedHash, salt) {
    // bcrypt includes salt in the hash, so we can compare directly
    return await bcryptjs_1.default.compare(password, storedHash);
}
// ============ AES-256-GCM ENCRYPTION ============
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
    // Combine salt + iv + encrypted data
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
// ============ RSA KEY GENERATION & ENCRYPTION ============
async function generateRSAKeyPair() {
    // Generate key pair for both encryption and signing
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
// ============ RSA DIGITAL SIGNATURES ============
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
// ============ GENERATE FIR REFERENCE NUMBER ============
function generateFIRNumber(stateCode = 'IN') {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return `FIR-${year}-${stateCode}-${random}`;
}
// ============ TOTP FOR MFA ============
function base32ToBytes(base32) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    for (const char of base32.toUpperCase().replace(/=+$/, '')) {
        const val = alphabet.indexOf(char);
        if (val === -1)
            continue;
        bits += val.toString(2).padStart(5, '0');
    }
    const bytes = new Uint8Array(Math.floor(bits.length / 8));
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(bits.slice(i * 8, (i + 1) * 8), 2);
    }
    return bytes;
}
function generateTOTPSecret() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    const array = new Uint8Array(20);
    crypto.getRandomValues(array);
    for (const byte of array) {
        secret += chars[byte % 32];
    }
    return secret;
}
async function generateTOTP(secret, timeStep = 30) {
    // Check if Web Crypto API is available
    if (typeof crypto === 'undefined' || !crypto.subtle) {
        if (typeof window !== 'undefined' && window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
            throw new Error("Secure context required. Please use 'localhost' or HTTPS to enable MFA features.");
        }
        throw new Error("Web Crypto API not available in this environment.");
    }
    const counter = Math.floor(Date.now() / 1000 / timeStep);
    return computeTOTPCode(secret, counter);
}
async function verifyTOTP(token, secret, timeWindow = 1) {
    // Check if Web Crypto API is available
    if (typeof crypto === 'undefined' || !crypto.subtle) {
        if (typeof window !== 'undefined' && window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
            throw new Error("Secure context required. Please use 'localhost' or HTTPS to enable MFA features.");
        }
    }
    const timeStep = 30;
    for (let i = -timeWindow; i <= timeWindow; i++) {
        const counter = Math.floor(Date.now() / 1000 / timeStep) + i;
        const code = await computeTOTPCode(secret, counter);
        if (code === token) {
            return true;
        }
    }
    return false;
}
/**
 * Shared helper to compute TOTP code for a given counter value.
 */
async function computeTOTPCode(secret, counter) {
    const counterBuffer = new ArrayBuffer(8);
    const counterView = new DataView(counterBuffer);
    counterView.setBigUint64(0, BigInt(counter), false);
    const keyBytes = base32ToBytes(secret);
    const key = await crypto.subtle.importKey('raw', keyBytes.buffer, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, counterBuffer);
    const signatureArray = new Uint8Array(signature);
    // HMAC SHA-1 is 20 bytes, so this is safe
    const lastByte = signatureArray[signatureArray.length - 1];
    const offset = lastByte & 0x0f;
    const code = (((signatureArray[offset] & 0x7f) << 24) |
        ((signatureArray[offset + 1] & 0xff) << 16) |
        ((signatureArray[offset + 2] & 0xff) << 8) |
        (signatureArray[offset + 3] & 0xff)) % 1000000;
    return code.toString().padStart(6, '0');
}
//# sourceMappingURL=security.js.map