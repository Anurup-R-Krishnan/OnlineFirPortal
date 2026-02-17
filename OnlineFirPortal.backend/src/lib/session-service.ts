import { randomBytes, createHash } from 'crypto';
import { prisma } from './prisma';

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * create new session
 */
export async function createSession(
    userId: string,
    ipAddress?: string | undefined,
    userAgent?: string | undefined
): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + SESSION_DURATION);

    const data: any = {
        userId,
        tokenHash,
        expiresAt,
    };

    if (ipAddress) data.ipAddress = ipAddress;
    if (userAgent) data.userAgent = userAgent;

    await prisma.session.create({ data });

    return token;
}

/**
 * verify session token
 */
export async function verifySession(token: string): Promise<{
    valid: boolean;
    userId?: string;
}> {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const session = await prisma.session.findUnique({
        where: { tokenHash },
    });

    if (!session) {
        return { valid: false };
    }

    if (session.revoked) {
        return { valid: false };
    }

    if (session.expiresAt < new Date()) {
        return { valid: false };
    }

    // update last activity
    await prisma.session.update({
        where: { id: session.id },
        data: { lastActivity: new Date() },
    });

    return {
        valid: true,
        userId: session.userId,
    };
}

/**
 * revoke session
 */
export async function revokeSession(token: string): Promise<void> {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    await prisma.session.updateMany({
        where: { tokenHash },
        data: {
            revoked: true,
            revokedAt: new Date(),
        },
    });
}

/**
 * revoke all user sessions
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
    await prisma.session.updateMany({
        where: { userId, revoked: false },
        data: {
            revoked: true,
            revokedAt: new Date(),
        },
    });
}

/**
 * get active sessions for user
 */
export async function getUserSessions(userId: string) {
    return await prisma.session.findMany({
        where: {
            userId,
            revoked: false,
            expiresAt: { gte: new Date() },
        },
        orderBy: { lastActivity: 'desc' },
    });
}

/**
 * cleanup expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
    await prisma.session.deleteMany({
        where: {
            expiresAt: { lt: new Date() },
        },
    });
}
