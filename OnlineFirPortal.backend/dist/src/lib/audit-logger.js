"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = logAudit;
exports.logAuthAttempt = logAuthAttempt;
exports.logFIROperation = logFIROperation;
exports.logUserOperation = logUserOperation;
exports.queryAuditLogs = queryAuditLogs;
const prisma_1 = require("./prisma");
const client_1 = require("@prisma/client");
/**
 * log an audit event
 */
async function logAudit(entry) {
    try {
        const data = {
            action: entry.action,
            success: entry.success ?? true,
        };
        if (entry.userId)
            data.userId = entry.userId;
        if (entry.userRole)
            data.userRole = entry.userRole;
        if (entry.userName)
            data.userName = entry.userName;
        if (entry.resourceType)
            data.resourceType = entry.resourceType;
        if (entry.resourceId)
            data.resourceId = entry.resourceId;
        if (entry.ipAddress)
            data.ipAddress = entry.ipAddress;
        if (entry.userAgent)
            data.userAgent = entry.userAgent;
        if (entry.changes)
            data.changes = JSON.stringify(entry.changes);
        if (entry.errorMessage)
            data.errorMessage = entry.errorMessage;
        if (entry.firId)
            data.firId = entry.firId;
        await prisma_1.prisma.auditLog.create({ data });
    }
    catch (error) {
        console.error('[audit logger error]', error);
    }
}
/**
 * log authentication attempt
 */
async function logAuthAttempt(email, success, ipAddress, userAgent, errorMessage) {
    await logAudit({
        userName: email,
        action: success ? client_1.AuditAction.LOGIN_SUCCESS : client_1.AuditAction.LOGIN_FAILED,
        ipAddress,
        userAgent,
        success,
        errorMessage,
    });
}
/**
 * log fir operation
 */
async function logFIROperation(action, firId, userId, userRole, changes, ipAddress) {
    await logAudit({
        userId,
        userRole,
        action,
        resourceType: 'FIR',
        resourceId: firId,
        firId,
        changes,
        ipAddress,
    });
}
/**
 * log user management operation
 */
async function logUserOperation(action, targetUserId, performedBy, performedByRole, changes, ipAddress) {
    await logAudit({
        userId: performedBy,
        userRole: performedByRole,
        action,
        resourceType: 'User',
        resourceId: targetUserId,
        changes,
        ipAddress,
    });
}
/**
 * query audit logs with filters
 */
async function queryAuditLogs(filters) {
    const where = {};
    if (filters.userId)
        where.userId = filters.userId;
    if (filters.action)
        where.action = filters.action;
    if (filters.resourceType)
        where.resourceType = filters.resourceType;
    if (filters.resourceId)
        where.resourceId = filters.resourceId;
    if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate)
            where.createdAt.gte = filters.startDate;
        if (filters.endDate)
            where.createdAt.lte = filters.endDate;
    }
    const [logs, total] = await Promise.all([
        prisma_1.prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: filters.limit || 100,
            skip: filters.offset || 0,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        }),
        prisma_1.prisma.auditLog.count({ where }),
    ]);
    return {
        logs: logs.map(log => ({
            ...log,
            changes: log.changes ? JSON.parse(log.changes) : null,
        })),
        total,
        limit: filters.limit || 100,
        offset: filters.offset || 0,
    };
}
//# sourceMappingURL=audit-logger.js.map