/**
 * JWT Authentication & Token Management
 * Implements secure token generation and verification for session management
 */
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
export declare function generateAccessToken(payload: TokenPayload): string;
/**
 * Generate refresh token (long-lived)
 */
export declare function generateRefreshToken(userId: string): string;
/**
 * Verify access token
 */
export declare function verifyAccessToken(token: string): TokenPayload | null;
/**
 * Verify refresh token
 */
export declare function verifyRefreshToken(token: string): {
    userId: string;
} | null;
//# sourceMappingURL=jwt.d.ts.map