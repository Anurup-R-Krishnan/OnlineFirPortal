"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSession = createSession;
exports.verifySession = verifySession;
exports.revokeSession = revokeSession;
exports.revokeAllUserSessions = revokeAllUserSessions;
exports.getUserSessions = getUserSessions;
exports.cleanupExpiredSessions = cleanupExpiredSessions;
const crypto_1 = require("crypto");
const prisma_1 = require("./prisma");
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
/**
 * create new session
 */
async function createSession(userId, ipAddress, userAgent) {
    const token = (0, crypto_1.randomBytes)(32).toString('hex');
    const tokenHash = (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + SESSION_DURATION);
    const data = {
        userId,
        tokenHash,
        expiresAt,
    };
    if (ipAddress)
        data.ipAddress = ipAddress;
    if (userAgent)
        data.userAgent = userAgent;
    await prisma_1.prisma.session.create({ data });
    return token;
}
/**
 * verify session token
 */
async function verifySession(token) {
    const tokenHash = (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    const session = await prisma_1.prisma.session.findUnique({
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
    await prisma_1.prisma.session.update({
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
async function revokeSession(token) {
    const tokenHash = (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    await prisma_1.prisma.session.update({
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
async function revokeAllUserSessions(userId) {
    await prisma_1.prisma.session.updateMany({
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
async function getUserSessions(userId) {
    return await prisma_1.prisma.session.findMany({
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
async function cleanupExpiredSessions() {
    await prisma_1.prisma.session.deleteMany({
        where: {
            expiresAt: { lt: new Date() },
        },
    });
}
//# sourceMappingURL=session-service.js.map