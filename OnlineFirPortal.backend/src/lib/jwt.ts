/**
 * JWT Authentication & Token Management
 * Implements secure token generation and verification for session management
 */

import jwt from 'jsonwebtoken';
import { env } from './env';

// In production, use environment variables
const JWT_SECRET = env.jwtSecret;
const JWT_REFRESH_SECRET = env.jwtRefreshSecret;
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  mfaVerified: boolean;
  name?: string;
  passwordChangeRequired?: boolean;
  mfaSetupRequired?: boolean;
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

