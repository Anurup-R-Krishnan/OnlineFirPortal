import { describe, expect, it } from '@jest/globals';
import {
  decryptAES,
  encryptAES,
  generateRSAKeyPair,
  signData,
  verifySignature,
} from '../../../src/lib/security';

/**
 * Boundary tests for the cryptographic integrity layer. These encode the
 * failure boundaries the FIR evidence pipeline depends on: a modified
 * ciphertext must never decrypt to corrupt plaintext, a wrong key must never
 * succeed, and a tampered digital signature must never verify.
 */

const TEST_PASSWORD = 'a-test-encryption-password-with-sufficient-entropy';

describe('AES-256-GCM encryption integrity', () => {
  it('round-trips plaintext through encryption and decryption', async () => {
    const secret = 'FIR payload: complainant statement and evidence references';
    const ciphertext = await encryptAES(secret, TEST_PASSWORD);

    expect(ciphertext).not.toBe(secret);
    await expect(decryptAES(ciphertext, TEST_PASSWORD)).resolves.toBe(secret);
  });

  it('does not leak plaintext into the stored ciphertext', async () => {
    const secret = 'Aadhaar-verified complainant mobile: 9876543210';
    const ciphertext = await encryptAES(secret, TEST_PASSWORD);

    expect(ciphertext).not.toContain('9876543210');
    expect(ciphertext).not.toContain('Aadhaar');
  });

  it('rejects a tampered ciphertext instead of returning corrupt plaintext', async () => {
    const ciphertext = await encryptAES('tamper-target payload', TEST_PASSWORD);

    // Flip the final byte of the AES-GCM payload. The auth tag then fails to
    // verify and WebCrypto must reject rather than yield altered data.
    const bytes = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
    bytes[bytes.length - 1] = (bytes[bytes.length - 1] ?? 0) ^ 0xff;
    const tampered = btoa(String.fromCharCode(...bytes));

    await expect(decryptAES(tampered, TEST_PASSWORD)).rejects.toThrow();
  });

  it('rejects a ciphertext encrypted under a different password', async () => {
    const ciphertext = await encryptAES('sealed under one key', TEST_PASSWORD);

    await expect(decryptAES(ciphertext, 'the-wrong-password')).rejects.toThrow();
  });
});

describe('RSA-PSS digital signature integrity', () => {
  it('verifies a signature produced over the same data and key', async () => {
    const { publicKey, privateKey } = await generateRSAKeyPair();
    const data = 'chargesheet summary with officer signature';

    const signature = await signData(data, privateKey);
    await expect(verifySignature(data, signature, publicKey)).resolves.toBe(true);
  });

  it('rejects a signature over modified data', async () => {
    const { publicKey, privateKey } = await generateRSAKeyPair();
    const signature = await signData('original investigation note', privateKey);

    await expect(verifySignature('tampered investigation note', signature, publicKey)).resolves.toBe(false);
  });

  it('rejects a signature generated under a different key pair', async () => {
    const first = await generateRSAKeyPair();
    const second = await generateRSAKeyPair();
    const signature = await signData('sealed by the first officer', first.privateKey);

    await expect(verifySignature('sealed by the first officer', signature, second.publicKey)).resolves.toBe(false);
  });
});
