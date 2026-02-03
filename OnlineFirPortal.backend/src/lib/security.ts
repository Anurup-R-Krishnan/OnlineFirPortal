/**
 * Security Utilities for Online FIR Portal
 * Implements: Encryption (AES-256-GCM), Hashing (SHA-256 + Salt + bcrypt), 
 * Digital Signatures (RSA-SHA256), and Encoding (Base64)
 */

import bcrypt from 'bcryptjs';
import { webcrypto } from 'crypto';

// Polyfill for Node.js environment if global crypto is not available or partial
const crypto = (globalThis.crypto || webcrypto) as Crypto;

// Re-export access control utilities
export * from './access-control';

// ============ ENCODING & DECODING (Base64) ============

export function encodeBase64(data: string): string {
  // Works in both browser and Node.js (Node 16+)
  return btoa(unescape(encodeURIComponent(data)));
}

export function decodeBase64(encoded: string): string {
  return decodeURIComponent(escape(atob(encoded)));
}

// ============ HASHING WITH SALT ============

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

// ============ PASSWORD HASHING WITH BCRYPT ============
// Using bcrypt for industry-standard password hashing with built-in salt

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return { hash, salt };
}

export async function verifyPassword(password: string, storedHash: string, salt?: string): Promise<boolean> {
  // bcrypt includes salt in the hash, so we can compare directly
  return await bcrypt.compare(password, storedHash);
}



// ============ AES-256-GCM ENCRYPTION ============

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

  // Combine salt + iv + encrypted data
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

// ============ RSA KEY GENERATION & ENCRYPTION ============

export async function generateRSAKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  // Generate key pair for both encryption and signing
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

// ============ RSA DIGITAL SIGNATURES ============

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

// ============ GENERATE FIR REFERENCE NUMBER ============

export function generateFIRNumber(stateCode: string = 'IN'): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `FIR-${year}-${stateCode}-${random}`;
}

// ============ TOTP FOR MFA ============

function base32ToBytes(base32: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const char of base32.toUpperCase().replace(/=+$/, '')) {
    const val = alphabet.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, (i + 1) * 8), 2);
  }
  return bytes;
}

export function generateTOTPSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  const array = new Uint8Array(20);
  crypto.getRandomValues(array);
  for (const byte of array) {
    secret += chars[byte % 32];
  }
  return secret;
}

export async function generateTOTP(secret: string, timeStep: number = 30): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error("Web Crypto API not available in this environment.");
  }

  const counter = Math.floor(Date.now() / 1000 / timeStep);
  return computeTOTPCode(secret, counter);
}

export async function verifyTOTP(token: string, secret: string, timeWindow: number = 1): Promise<boolean> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error("Web Crypto API not available in this environment.");
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
async function computeTOTPCode(secret: string, counter: number): Promise<string> {
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  counterView.setBigUint64(0, BigInt(counter), false);

  const keyBytes = base32ToBytes(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, counterBuffer);
  const signatureArray = new Uint8Array(signature);

  // HMAC SHA-1 is 20 bytes, so this is safe
  const lastByte = signatureArray[signatureArray.length - 1]!;
  const offset = lastByte & 0x0f;

  const code = (
    ((signatureArray[offset]! & 0x7f) << 24) |
    ((signatureArray[offset + 1]! & 0xff) << 16) |
    ((signatureArray[offset + 2]! & 0xff) << 8) |
    (signatureArray[offset + 3]! & 0xff)
  ) % 1000000;

  return code.toString().padStart(6, '0');
}

