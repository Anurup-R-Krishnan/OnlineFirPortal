/**
 * create new session
 */
export declare function createSession(userId: string, ipAddress?: string | undefined, userAgent?: string | undefined): Promise<string>;
/**
 * verify session token
 */
export declare function verifySession(token: string): Promise<{
    valid: boolean;
    userId?: string;
}>;
/**
 * revoke session
 */
export declare function revokeSession(token: string): Promise<void>;
/**
 * revoke all user sessions
 */
export declare function revokeAllUserSessions(userId: string): Promise<void>;
/**
 * get active sessions for user
 */
export declare function getUserSessions(userId: string): Promise<{
    id: string;
    createdAt: Date;
    userId: string;
    ipAddress: string | null;
    userAgent: string | null;
    expiresAt: Date;
    tokenHash: string;
    lastActivity: Date;
    revoked: boolean;
    revokedAt: Date | null;
}[]>;
/**
 * cleanup expired sessions
 */
export declare function cleanupExpiredSessions(): Promise<void>;
//# sourceMappingURL=session-service.d.ts.map