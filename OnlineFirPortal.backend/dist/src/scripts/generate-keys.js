"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const generateKey = (length) => {
    return crypto_1.default.randomBytes(length).toString('hex');
};
console.log('--- Secure Key Generator ---');
console.log('Copy these values to your .env file:\n');
console.log(`JWT_SECRET="${generateKey(32)}"`);
console.log(`JWT_REFRESH_SECRET="${generateKey(32)}"`);
console.log(`ENCRYPTION_KEY="${generateKey(32)}"`); // 32 bytes = 64 hex chars (AES-256 requires 32 bytes)
console.log('\n----------------------------');
//# sourceMappingURL=generate-keys.js.map