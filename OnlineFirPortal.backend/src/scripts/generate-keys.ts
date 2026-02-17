import crypto from 'crypto';

const generateKey = (length: number) => {
    return crypto.randomBytes(length).toString('hex');
};

console.log('--- Secure Key Generator ---');
console.log('Copy these values to your .env file:\n');

console.log(`JWT_SECRET="${generateKey(32)}"`);
console.log(`JWT_REFRESH_SECRET="${generateKey(32)}"`);
console.log(`ENCRYPTION_KEY="${generateKey(32)}"`); // 32 bytes = 64 hex chars (AES-256 requires 32 bytes)
console.log(`FIR_ENCRYPTION_KEY="${generateKey(32)}"`);

console.log('\n----------------------------');
