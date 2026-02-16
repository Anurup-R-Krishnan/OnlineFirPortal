"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasPermission = hasPermission;
exports.isResourceOwner = isResourceOwner;
exports.canAccessFIR = canAccessFIR;
exports.canAccessDocument = canAccessDocument;
exports.canAccessUser = canAccessUser;
exports.getRolePermissions = getRolePermissions;
exports.logAccessAttempt = logAccessAttempt;
exports.canAccessRoute = canAccessRoute;
/**
 * Access Control Matrix
 * Defines what actions each role can perform on each resource
 */
const ACCESS_CONTROL_MATRIX = {
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
function hasPermission(role, resource, action) {
    const permissions = ACCESS_CONTROL_MATRIX[role]?.[resource];
    if (!permissions)
        return false;
    return permissions.includes(action);
}
/**
 * Check if user owns the resource (for citizen-level access)
 */
function isResourceOwner(userId, resourceOwnerId) {
    return userId === resourceOwnerId;
}
/**
 * Validate access to FIR
 * Citizens can only access their own FIRs
 * Police and Admin can access all FIRs
 */
function canAccessFIR(userRole, userId, firOwnerId, action) {
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
function canAccessDocument(userRole, userId, documentOwnerId, action) {
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
function canAccessUser(userRole, userId, targetUserId, action) {
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
function getRolePermissions(role) {
    return ACCESS_CONTROL_MATRIX[role];
}
/**
 * Log access attempt (for security auditing)
 */
function logAccessAttempt(log) {
    console.log('[ACCESS CONTROL AUDIT]', JSON.stringify(log, null, 2));
}
/**
 * Check if a role can access a specific route
 */
function canAccessRoute(role, route) {
    const routePermissions = {
        '/dashboard': ['citizen', 'police', 'admin'],
        '/file-fir': ['citizen'],
        '/track': ['citizen', 'police', 'admin'],
        '/police': ['police', 'admin'],
        '/admin': ['admin'],
    };
    const allowedRoles = routePermissions[route] || [];
    return allowedRoles.includes(role);
}
//# sourceMappingURL=access-control.js.map