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
export declare function logAudit(entry: AuditLogEntry): Promise<void>;
/**
 * log authentication attempt
 */
export declare function logAuthAttempt(email: string, success: boolean, ipAddress?: string, userAgent?: string, errorMessage?: string): Promise<void>;
/**
 * log fir operation
 */
export declare function logFIROperation(action: AuditAction, firId: string, userId: string, userRole: UserRole, changes?: Record<string, any>, ipAddress?: string): Promise<void>;
/**
 * log user management operation
 */
export declare function logUserOperation(action: AuditAction, targetUserId: string, performedBy: string, performedByRole: UserRole, changes?: Record<string, any>, ipAddress?: string): Promise<void>;
/**
 * query audit logs with filters
 */
export declare function queryAuditLogs(filters: {
    userId?: string;
    action?: AuditAction;
    resourceType?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}): Promise<{
    logs: {
        changes: any;
        user: {
            name: string;
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
        } | null;
        id: string;
        createdAt: Date;
        firId: string | null;
        userId: string | null;
        userRole: import(".prisma/client").$Enums.UserRole | null;
        userName: string | null;
        action: import(".prisma/client").$Enums.AuditAction;
        resourceType: string | null;
        resourceId: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        success: boolean;
        errorMessage: string | null;
    }[];
    total: number;
    limit: number;
    offset: number;
}>;
//# sourceMappingURL=audit-logger.d.ts.map