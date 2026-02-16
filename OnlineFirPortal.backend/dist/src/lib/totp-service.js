"use strict";
/**
 * totp service for google authenticator integration
 * provides time-based one-time password functionality
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTOTPSecret = generateTOTPSecret;
exports.verifyTOTP = verifyTOTP;
exports.generateRecoveryCodes = generateRecoveryCodes;
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
const APP_NAME = 'Online FIR Portal';
/**
 * generate totp secret and qr code for user
 */
async function generateTOTPSecret(userEmail) {
    const secret = speakeasy_1.default.generateSecret({
        name: `${APP_NAME} (${userEmail})`,
        issuer: APP_NAME,
        length: 32,
    });
    if (!secret.otpauth_url) {
        throw new Error('failed to generate totp secret');
    }
    const qrCode = await qrcode_1.default.toDataURL(secret.otpauth_url);
    return {
        secret: secret.base32,
        qrCode,
        manualEntryKey: secret.base32,
    };
}
/**
 * verify totp token
 * allows ±1 window for time drift
 */
function verifyTOTP(token, secret) {
    return speakeasy_1.default.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 1, // allow ±30 seconds time drift
    });
}
/**
 * generate recovery codes for mfa backup
 * returns 10 random codes
 */
function generateRecoveryCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        codes.push(code);
    }
    return codes;
}
//# sourceMappingURL=totp-service.js.map