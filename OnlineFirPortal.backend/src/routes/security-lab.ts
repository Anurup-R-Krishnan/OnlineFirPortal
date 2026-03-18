import express from 'express';
import { createHash, randomBytes } from 'crypto';
import { authenticateToken } from '../lib/auth-middleware';
import { prisma } from '../lib/prisma';
import { encodeBase64, decodeBase64, encryptAES, encryptRSA } from '../lib/security';
import { getAccessControlPolicy } from '../lib/access-control';

const router = express.Router();

export function runBase64Demo(mode: 'encode' | 'decode', value: string) {
  return mode === 'encode' ? encodeBase64(value) : decodeBase64(value);
}

export async function buildKeyExchangeDemo(params: {
  publicKey: string;
  email: string;
  role: string;
  message?: string;
}) {
  const sessionKey = randomBytes(32).toString('base64');
  const plaintext = JSON.stringify({
    type: 'lab-key-exchange-demo',
    actor: params.email,
    role: params.role,
    issuedAt: new Date().toISOString(),
    message: params.message || 'Hybrid encryption demonstration payload',
  });

  const encryptedSessionKey = await encryptRSA(sessionKey, params.publicKey);
  const encryptedPayload = await encryptAES(plaintext, sessionKey);

  return {
    keyExchange: {
      asymmetricAlgorithm: 'RSA-OAEP-2048 / SHA-256',
      symmetricAlgorithm: 'AES-256-GCM',
      description: 'Server generates an AES session key and encrypts it with the user public key.',
      encryptedSessionKey,
      sessionKeyFingerprint: createHash('sha256').update(sessionKey).digest('hex').slice(0, 16),
    },
    encryptedPayload,
    payloadDigest: createHash('sha256').update(plaintext).digest('hex'),
    note: 'Decrypt the session key with the matching private key, then use that session key to decrypt the payload.',
  };
}

router.get('/access-control-matrix', authenticateToken, async (req, res) => {
  const currentRole = req.user!.role;

  res.json({
    success: true,
    model: 'RBAC with ACL / access control matrix',
    currentRole,
    policy: getAccessControlPolicy(),
    rubricCoverage: {
      subjects: ['CITIZEN', 'OFFICER', 'ADMIN'],
      objects: ['fir', 'documents', 'users'],
      enforcedProgrammatically: true,
    },
  });
});

router.post('/encoding/base64', authenticateToken, async (req, res) => {
  const { mode, value } = req.body as { mode?: 'encode' | 'decode'; value?: string };

  if (!mode || !value) {
    res.status(400).json({ error: 'mode and value are required' });
    return;
  }

  try {
    const result = runBase64Demo(mode, value);

    res.json({
      success: true,
      technique: 'Base64',
      mode,
      input: value,
      output: result,
    });
  } catch (error: any) {
    res.status(400).json({
      error: mode === 'decode' ? 'invalid base64 input' : 'encoding failed',
      details: error?.message,
    });
  }
});

router.post('/key-exchange/demo', authenticateToken, async (req, res) => {
  const userId = req.user!.userId;
  const { message } = req.body as { message?: string };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      publicKey: true,
      role: true,
      email: true,
    },
  });

  if (!user?.publicKey) {
    res.status(400).json({
      error: 'public key not registered',
      message: 'register an RSA public key before running the key exchange demo',
    });
    return;
  }

  const demo = await buildKeyExchangeDemo({
    publicKey: user.publicKey,
    email: user.email,
    role: user.role,
    ...(message ? { message } : {}),
  });

  res.json({
    success: true,
    ...demo,
  });
});

export default router;
