import { describe, it, expect, beforeEach } from 'vitest';
import { generateKeyPair, signData, verifySignature } from '../../lib/digital-signature';

describe('Digital Signature Utilities', () => {
    describe('generateKeyPair', () => {
        it('should generate a valid RSA key pair', async () => {
            const keyPair = await generateKeyPair();

            expect(keyPair).toHaveProperty('publicKey');
            expect(keyPair).toHaveProperty('privateKey');
            expect(typeof keyPair.publicKey).toBe('string');
            expect(typeof keyPair.privateKey).toBe('string');
            expect(keyPair.publicKey.length).toBeGreaterThan(0);
            expect(keyPair.privateKey.length).toBeGreaterThan(0);
        });

        it('should generate different keys each time', async () => {
            const keyPair1 = await generateKeyPair();
            const keyPair2 = await generateKeyPair();

            expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
            expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
        });
    });

    describe('signData', () => {
        it('should sign data with private key', async () => {
            const keyPair = await generateKeyPair();
            const data = 'Test FIR data to sign';

            const signature = await signData(data, keyPair.privateKey);

            expect(typeof signature).toBe('string');
            expect(signature.length).toBeGreaterThan(0);
        });

        it('should produce different signatures for different data', async () => {
            const keyPair = await generateKeyPair();
            const data1 = 'First FIR';
            const data2 = 'Second FIR';

            const signature1 = await signData(data1, keyPair.privateKey);
            const signature2 = await signData(data2, keyPair.privateKey);

            expect(signature1).not.toBe(signature2);
        });
    });

    describe('verifySignature', () => {
        it('should verify valid signature', async () => {
            const keyPair = await generateKeyPair();
            const data = 'FIR data for verification';
            const signature = await signData(data, keyPair.privateKey);

            const isValid = await verifySignature(data, signature, keyPair.publicKey);

            expect(isValid).toBe(true);
        });

        it('should reject invalid signature', async () => {
            const keyPair = await generateKeyPair();
            const data = 'Original data';
            const signature = await signData(data, keyPair.privateKey);

            // Try to verify with tampered data
            const tamperedData = 'Tampered data';
            const isValid = await verifySignature(tamperedData, signature, keyPair.publicKey);

            expect(isValid).toBe(false);
        });

        it('should reject signature from different key', async () => {
            const keyPair1 = await generateKeyPair();
            const keyPair2 = await generateKeyPair();
            const data = 'Test data';

            const signature = await signData(data, keyPair1.privateKey);
            const isValid = await verifySignature(data, signature, keyPair2.publicKey);

            expect(isValid).toBe(false);
        });
    });

    describe('End-to-end signature flow', () => {
        it('should complete full signature workflow', async () => {
            // 1. Generate keys
            const keys = await generateKeyPair();

            // 2. Create FIR data
            const firData = JSON.stringify({
                complaintType: 'Theft',
                incidentDate: '2024-01-15',
                description: 'Mobile phone stolen'
            });

            // 3. Sign the data
            const signature = await signData(firData, keys.privateKey);

            // 4. Verify the signature
            const isValid = await verifySignature(firData, signature, keys.publicKey);

            expect(isValid).toBe(true);
        });
    });
});
