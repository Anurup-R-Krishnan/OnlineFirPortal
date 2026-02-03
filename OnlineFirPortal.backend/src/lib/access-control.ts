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
 * Access Control Matrix
 * Defines what actions each role can perform on each resource
 */
const ACCESS_CONTROL_MATRIX: Record<UserRole, Record<Resource, Action[]>> = {
  citizen: {
    fir: ['create', 'read'], 
    documents: ['read', 'upload'], 
    users: ['read', 'update'], 
    reports: [], 
    settings: [], 
  },
  police: {
    fir: ['read', 'update', 'assign'], 
    documents: ['read'], 
    users: ['read'], 
    reports: ['read'], 
    settings: ['read'], 
  },
  admin: {
    fir: ['create', 'read', 'update', 'delete', 'assign'], 
    documents: ['read', 'upload', 'delete'], 
    users: ['create', 'read', 'update', 'delete'], 
    reports: ['read', 'generate'], 
    settings: ['read', 'update'], 
  },
};

/**
 * Check if a role has permission to perform an action on a resource
 */
export function hasPermission(role: UserRole, resource: Resource, action: Action): boolean {
  const permissions = ACCESS_CONTROL_MATRIX[role]?.[resource];
  if (!permissions) return false;
  return permissions.includes(action);
}

/**
 * Check if user owns the resource (for citizen-level access)
 */
export function isResourceOwner(userId: string, resourceOwnerId: string): boolean {
  return userId === resourceOwnerId;
}

/**
 * Validate access to FIR
 * Citizens can only access their own FIRs
 * Police and Admin can access all FIRs
 */
export function canAccessFIR(
  userRole: UserRole,
  userId: string,
  firOwnerId: string,
  action: Action
): { allowed: boolean; reason?: string } {
  
  if (!hasPermission(userRole, 'fir', action)) {
    return {
      allowed: false,
      reason: `Role '${userRole}' does not have permission to '${action}' FIR`,
    };
  }

  
  if (userRole === 'citizen' && !isResourceOwner(userId, firOwnerId)) {
    return {
      allowed: false,
      reason: 'Citizens can only access their own FIRs',
    };
  }

  return { allowed: true };
}

/**
 * Validate access to documents
 */
export function canAccessDocument(
  userRole: UserRole,
  userId: string,
  documentOwnerId: string,
  action: Action
): { allowed: boolean; reason?: string } {
  if (!hasPermission(userRole, 'documents', action)) {
    return {
      allowed: false,
      reason: `Role '${userRole}' does not have permission to '${action}' documents`,
    };
  }

  
  if (userRole === 'citizen' && !isResourceOwner(userId, documentOwnerId)) {
    return {
      allowed: false,
      reason: 'Citizens can only access their own documents',
    };
  }

  return { allowed: true };
}

/**
 * Validate access to user profiles
 */
export function canAccessUser(
  userRole: UserRole,
  userId: string,
  targetUserId: string,
  action: Action
): { allowed: boolean; reason?: string } {
  if (!hasPermission(userRole, 'users', action)) {
    return {
      allowed: false,
      reason: `Role '${userRole}' does not have permission to '${action}' user profiles`,
    };
  }

  
  if ((userRole === 'citizen' || userRole === 'police') &&
    action === 'update' &&
    !isResourceOwner(userId, targetUserId)) {
    return {
      allowed: false,
      reason: 'You can only update your own profile',
    };
  }

  return { allowed: true };
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Record<Resource, Action[]> {
  return ACCESS_CONTROL_MATRIX[role];
}

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
export function logAccessAttempt(log: AuditLog): void {
  
  console.log('[ACCESS CONTROL AUDIT]', JSON.stringify(log, null, 2));
}

/**
 * Check if a role can access a specific route
 */
export function canAccessRoute(role: UserRole, route: string): boolean {
  const routePermissions: Record<string, UserRole[]> = {
    '/dashboard': ['citizen', 'police', 'admin'],
    '/file-fir': ['citizen'],
    '/track': ['citizen', 'police', 'admin'],
    '/police': ['police', 'admin'],
    '/admin': ['admin'],
  };

  
  const allowedRoles = routePermissions[route] || [];
  return allowedRoles.includes(role);
}
