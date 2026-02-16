import bcrypt from 'bcryptjs';
import { webcrypto } from 'crypto';
import { prisma } from './prisma';
import { logAuthAttempt } from './audit-logger';

const crypto = (globalThis.crypto || webcrypto) as Crypto;

export * from './access-control';

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const loginAttemptStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 100;
const LOGIN_ATTEMPT_WINDOW = 30 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const ACCOUNT_LOCKOUT_DURATION = 30 * 60 * 1000;

export function checkRateLimit(ipAddress: string): boolean {
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

export async function trackFailedLogin(
  userId: string,
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ locked: boolean; attemptsRemaining: number }> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: { increment: 1 },
    },
  });

  await logAuthAttempt(email, false, ipAddress, userAgent, 'invalid credentials');

  const attemptsRemaining = MAX_LOGIN_ATTEMPTS - user.failedLoginAttempts;

  if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + ACCOUNT_LOCKOUT_DURATION);
    await prisma.user.update({
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

export async function resetFailedLoginAttempts(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lastLoginAt: new Date(),
    },
  });
}

export async function isAccountLocked(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accountStatus: true, lockedUntil: true },
  });

  if (!user) return false;

  if (user.accountStatus === 'LOCKED') {
    if (user.lockedUntil && user.lockedUntil < new Date()) {
      await prisma.user.update({
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

export async function unlockAccount(userId: string, adminId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      accountStatus: 'ACTIVE',
      lockedUntil: null,
      failedLoginAttempts: 0,
    },
  });
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidMobile(mobile: string): boolean {
  const normalized = mobile.replace(/\s+/g, '').replace(/^\+?91/, '').replace(/^0+/, '');
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(normalized);
}

export function normalizeMobile(mobile: string): string {
  return mobile.replace(/\s+/g, '').replace(/^\+?91/, '').replace(/^0+/, '');
}

export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => chars[byte % chars.length]).join('');
}

export function cleanupRateLimits(): void {
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

export function encodeBase64(data: string): string {
  return btoa(unescape(encodeURIComponent(data)));
}

export function decodeBase64(encoded: string): string {
  return decodeURIComponent(escape(atob(encoded)));
}

export async function generateSalt(length: number = 16): Promise<string> {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function hashWithSalt(data: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataWithSalt = encoder.encode(data + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataWithSalt);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return { hash, salt };
}

export async function verifyPassword(password: string, storedHash: string, salt?: string): Promise<boolean> {
  return await bcrypt.compare(password, storedHash);
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptAES(plaintext: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encoder.encode(plaintext)
  );

  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decryptAES(ciphertext: string, password: string): Promise<string> {
  const combined = new Uint8Array(atob(ciphertext).split('').map(c => c.charCodeAt(0)));

  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const encrypted = combined.slice(28);

  const key = await deriveKey(password, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encrypted
  );

  return new TextDecoder().decode(decrypted);
}

export async function generateRSAKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const encryptionKeyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['encrypt', 'decrypt']
  );

  const publicKey = await crypto.subtle.exportKey('spki', encryptionKeyPair.publicKey);
  const privateKey = await crypto.subtle.exportKey('pkcs8', encryptionKeyPair.privateKey);

  return {
    publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKey))),
    privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKey)))
  };
}

export async function encryptRSA(data: string, publicKeyBase64: string): Promise<string> {
  const encoder = new TextEncoder();
  const publicKeyBuffer = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));

  const publicKey = await crypto.subtle.importKey(
    'spki',
    publicKeyBuffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    encoder.encode(data)
  );

  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

export async function decryptRSA(encryptedBase64: string, privateKeyBase64: string): Promise<string> {
  const privateKeyBuffer = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0));
  const encryptedBuffer = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    encryptedBuffer
  );

  return new TextDecoder().decode(decrypted);
}

export async function generateRSASigningKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-PSS',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['sign', 'verify']
  );

  const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKey))),
    privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKey)))
  };
}

export async function signData(data: string, privateKeyBase64: string): Promise<string> {
  const encoder = new TextEncoder();
  const privateKeyBuffer = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0));

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    { name: 'RSA-PSS', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'RSA-PSS', saltLength: 32 },
    privateKey,
    encoder.encode(data)
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export async function verifySignature(data: string, signatureBase64: string, publicKeyBase64: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const publicKeyBuffer = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));
  const signatureBuffer = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));

  const publicKey = await crypto.subtle.importKey(
    'spki',
    publicKeyBuffer,
    { name: 'RSA-PSS', hash: 'SHA-256' },
    false,
    ['verify']
  );

  return crypto.subtle.verify(
    { name: 'RSA-PSS', saltLength: 32 },
    publicKey,
    signatureBuffer,
    encoder.encode(data)
  );
}

export function generateFIRNumber(stateCode: string = 'IN'): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `FIR-${year}-${stateCode}-${random}`;
}

let warnedDefaultEncKey = false;
function ensureEncryptionKey(): string {
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

export async function encryptData(data: string): Promise<string> {
  const key = ensureEncryptionKey();
  return await encryptAES(data, key);
}

export async function decryptData(encryptedData: string): Promise<string> {
  const key = ensureEncryptionKey();
  return await decryptAES(encryptedData, key);
}

