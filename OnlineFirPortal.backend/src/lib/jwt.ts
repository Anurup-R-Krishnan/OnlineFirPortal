/**
 * JWT Authentication & Token Management
 * Implements secure token generation and verification for session management
 */

import jwt from 'jsonwebtoken';

// Helper to generate random hex string using Web Crypto API
function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

// In production, use environment variables
const JWT_SECRET = process.env.JWT_SECRET || randomHex(32);
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || randomHex(32);
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  mfaVerified: boolean;
  name?: string;
}

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'fir-portal',
    audience: 'fir-portal-users',
  });
}

/**
 * Generate refresh token (long-lived)
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'fir-portal',
  });
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'fir-portal',
      audience: 'fir-portal-users',
    }) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'fir-portal',
    }) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
}


