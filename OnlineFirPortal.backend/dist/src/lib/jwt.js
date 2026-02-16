"use strict";
/**
 * JWT Authentication & Token Management
 * Implements secure token generation and verification for session management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Helper to generate random hex string using Web Crypto API (fallback to Node crypto.randomBytes)
function randomHex(bytes) {
    try {
        const cryptoObj = globalThis.crypto;
        if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
            const arr = new Uint8Array(bytes);
            cryptoObj.getRandomValues(arr);
            return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
        }
    }
    catch (e) {
        // fall through to Node fallback
    }
    // Fallback to Node's crypto
    return require('crypto').randomBytes(bytes).toString('hex');
}
// In production, use environment variables
const JWT_SECRET = process.env.JWT_SECRET || randomHex(32);
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || randomHex(32);
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
/**
 * Generate access token (short-lived)
 */
function generateAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
        issuer: 'fir-portal',
        audience: 'fir-portal-users',
    });
}
/**
 * Generate refresh token (long-lived)
 */
function generateRefreshToken(userId) {
    return jsonwebtoken_1.default.sign({ userId }, JWT_REFRESH_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRY,
        issuer: 'fir-portal',
    });
}
/**
 * Verify access token
 */
function verifyAccessToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET, {
            issuer: 'fir-portal',
            audience: 'fir-portal-users',
        });
        return decoded;
    }
    catch (error) {
        return null;
    }
}
/**
 * Verify refresh token
 */
function verifyRefreshToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET, {
            issuer: 'fir-portal',
        });
        return decoded;
    }
    catch (error) {
        return null;
    }
}
//# sourceMappingURL=jwt.js.map