import { prisma } from './prisma';
import { AuditAction, UserRole } from '@prisma/client';

export interface AuditLogEntry {
    userId?: string | undefined;
    userRole?: UserRole | undefined;
    userName?: string | undefined;
    action: AuditAction;
    resourceType?: string | undefined;
    resourceId?: string | undefined;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
    changes?: Record<string, any> | undefined;
    success?: boolean | undefined;
    errorMessage?: string | undefined;
    firId?: string | undefined;
}

/**
 * log an audit event
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
    try {
        const data: any = {
            action: entry.action,
            success: entry.success ?? true,
        };

        if (entry.userId) data.userId = entry.userId;
        if (entry.userRole) data.userRole = entry.userRole;
        if (entry.userName) data.userName = entry.userName;
        if (entry.resourceType) data.resourceType = entry.resourceType;
        if (entry.resourceId) data.resourceId = entry.resourceId;
        if (entry.ipAddress) data.ipAddress = entry.ipAddress;
        if (entry.userAgent) data.userAgent = entry.userAgent;
        if (entry.changes) data.changes = JSON.stringify(entry.changes);
        if (entry.errorMessage) data.errorMessage = entry.errorMessage;
        if (entry.firId) data.firId = entry.firId;

        await prisma.auditLog.create({ data });
    } catch (error) {
        console.error('[audit logger error]', error);
    }
}

/**
 * log authentication attempt
 */
export async function logAuthAttempt(
    email: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    errorMessage?: string
): Promise<void> {
    await logAudit({
        userName: email,
        action: success ? AuditAction.LOGIN_SUCCESS : AuditAction.LOGIN_FAILED,
        ipAddress,
        userAgent,
        success,
        errorMessage,
    });
}

/**
 * log fir operation
 */
export async function logFIROperation(
    action: AuditAction,
    firId: string,
    userId: string,
    userRole: UserRole,
    changes?: Record<string, any>,
    ipAddress?: string
): Promise<void> {
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
export async function logUserOperation(
    action: AuditAction,
    targetUserId: string,
    performedBy: string,
    performedByRole: UserRole,
    changes?: Record<string, any>,
    ipAddress?: string
): Promise<void> {
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
export async function queryAuditLogs(filters: {
    userId?: string;
    action?: AuditAction;
    resourceType?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.resourceType) where.resourceType = filters.resourceType;
    if (filters.resourceId) where.resourceId = filters.resourceId;

    if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
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
        prisma.auditLog.count({ where }),
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
