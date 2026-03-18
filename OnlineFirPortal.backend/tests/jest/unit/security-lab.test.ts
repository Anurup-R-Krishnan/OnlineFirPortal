import { describe, expect, it } from '@jest/globals';
import { decryptAES, decryptRSA, generateRSAKeyPair } from '../../../src/lib/security';
import { buildKeyExchangeDemo, runBase64Demo } from '../../../src/routes/security-lab';
import { getAccessControlPolicy } from '../../../src/lib/access-control';

describe('security lab helpers', () => {
  it('exposes the access-control policy with justifications', () => {
    const policy = getAccessControlPolicy();

    expect(policy.CITIZEN.resources.fir.why).toContain('Citizens');
    expect(policy.ADMIN.resources.settings.actions).toContain('update');
  });

  it('encodes and decodes Base64 values', () => {
    const encoded = runBase64Demo('encode', 'FIR-SECURITY-DEMO');
    const decoded = runBase64Demo('decode', encoded);

    expect(encoded).not.toBe('FIR-SECURITY-DEMO');
    expect(decoded).toBe('FIR-SECURITY-DEMO');
  });

  it('builds a hybrid RSA/AES key exchange payload that can be decrypted', async () => {
    const keyPair = await generateRSAKeyPair();
    const demo = await buildKeyExchangeDemo({
      publicKey: keyPair.publicKey,
      email: 'security-lab@example.com',
      role: 'CITIZEN',
      message: 'Evidence transfer authorization',
    });

    expect(demo.keyExchange.asymmetricAlgorithm).toContain('RSA-OAEP');
    expect(demo.keyExchange.symmetricAlgorithm).toBe('AES-256-GCM');

    const sessionKey = await decryptRSA(demo.keyExchange.encryptedSessionKey, keyPair.privateKey);
    const payload = await decryptAES(demo.encryptedPayload, sessionKey);

    expect(payload).toContain('Evidence transfer authorization');
    expect(payload).toContain('lab-key-exchange-demo');
  });
});
