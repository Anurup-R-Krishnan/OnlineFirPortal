/**
 * Access Control System - Role-Based Access Control (RBAC) with ACL
 *
 * ACCESS CONTROL MATRIX:
 *
 * Subjects (Roles):
 * 1. citizen - Regular users who can file and track their own FIRs
 * 2. police - Police officers who can view, update, and manage FIRs
 * 3. admin - System administrators with full control
 *
 * Objects (Resources):
 * 1. fir - FIR records (read, create, update, delete)
 * 2. documents - FIR-related documents (read, upload, delete)
 * 3. users - User profiles (read, update, delete)
 * 4. reports - Analytics and reports (read, generate)
 * 5. settings - System settings (read, update)
 *
 * ACCESS CONTROL LIST (ACL):
 *
 * CITIZEN can:
 * - Create their own FIR
 * - Read their own FIR
 * - Upload documents to their own FIR
 * - Read their own documents
 * - Read and update their own user profile
 *
 * POLICE can:
 * - Read all FIRs
 * - Update FIR status (registered, under-investigation, resolved, closed)
 * - Assign officers to FIRs
 * - Read all documents
 * - Read basic user information
 * - Read reports and analytics
 *
 * ADMIN can:
 * - All citizen permissions
 * - All police permissions
 * - Delete FIRs
 * - Delete documents
 * - Full user management (create, read, update, delete)
 * - Generate reports
 * - Manage system settings
 */
export type UserRole = 'citizen' | 'police' | 'admin';
export type Resource = 'fir' | 'documents' | 'users' | 'reports' | 'settings';
export type Action = 'create' | 'read' | 'update' | 'delete' | 'assign' | 'upload' | 'generate';
/**
 * Check if a role has permission to perform an action on a resource
 */
export declare function hasPermission(role: UserRole, resource: Resource, action: Action): boolean;
/**
 * Check if user owns the resource (for citizen-level access)
 */
export declare function isResourceOwner(userId: string, resourceOwnerId: string): boolean;
/**
 * Validate access to FIR
 * Citizens can only access their own FIRs
 * Police and Admin can access all FIRs
 */
export declare function canAccessFIR(userRole: UserRole, userId: string, firOwnerId: string, action: Action): {
    allowed: boolean;
    reason?: string;
};
/**
 * Validate access to documents
 */
export declare function canAccessDocument(userRole: UserRole, userId: string, documentOwnerId: string, action: Action): {
    allowed: boolean;
    reason?: string;
};
/**
 * Validate access to user profiles
 */
export declare function canAccessUser(userRole: UserRole, userId: string, targetUserId: string, action: Action): {
    allowed: boolean;
    reason?: string;
};
/**
 * Get all permissions for a role
 */
export declare function getRolePermissions(role: UserRole): Record<Resource, Action[]>;
/**
 * Audit log entry for access control
 */
export interface AuditLog {
    timestamp: string;
    userId: string;
    userRole: UserRole;
    resource: Resource;
    action: Action;
    resourceId: string;
    allowed: boolean;
    reason?: string;
}
/**
 * Log access attempt (for security auditing)
 */
export declare function logAccessAttempt(log: AuditLog): void;
/**
 * Check if a role can access a specific route
 */
export declare function canAccessRoute(role: UserRole, route: string): boolean;
//# sourceMappingURL=access-control.d.ts.map