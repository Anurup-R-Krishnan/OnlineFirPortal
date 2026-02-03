"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.checkPermission = checkPermission;
exports.requireRole = requireRole;
const jwt_1 = require("./jwt");
const access_control_1 = require("./access-control");
/**
 * Authentication Middleware
 * Extracts and verifies JWT token from request (Header or Cookie)
 */
async function authenticateToken(req, res, next) {
    try {
        // Get token from Authorization header
        const authHeader = req.headers['authorization'];
        let token = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
        // Fallback: Get token from cookie
        if (!token && req.cookies) {
            token = req.cookies['accessToken'];
        }
        if (!token) {
            res.status(401).json({ error: 'No authentication token provided' });
            return;
        }
        // Verify token
        const user = (0, jwt_1.verifyAccessToken)(token);
        if (!user) {
            res.status(401).json({ error: 'Invalid or expired token' });
            return;
        }
        // Check MFA verification for sensitive operations
        if (!user.mfaVerified) {
            res.status(401).json({ error: 'MFA verification required' });
            return;
        }
        req.user = user;
        next();
    }
    catch (err) {
        res.status(401).json({ error: err.message });
    }
}
function checkPermission(user, resource, action, resourceOwnerId) {
    const role = user.role;
    // Check basic permission
    if (!(0, access_control_1.hasPermission)(role, resource, action)) {
        (0, access_control_1.logAccessAttempt)({
            timestamp: new Date().toISOString(),
            userId: user.userId,
            userRole: role,
            resource,
            action,
            resourceId: resourceOwnerId || 'unknown',
            allowed: false,
            reason: `Role '${role}' does not have '${action}' permission on '${resource}'`
        });
        return {
            allowed: false,
            error: `Access denied: You don't have permission to ${action} ${resource}`
        };
    }
    // Additional ownership check for citizens
    if (role === 'citizen' && resourceOwnerId && resourceOwnerId !== user.userId) {
        (0, access_control_1.logAccessAttempt)({
            timestamp: new Date().toISOString(),
            userId: user.userId,
            userRole: role,
            resource,
            action,
            resourceId: resourceOwnerId,
            allowed: false,
            reason: 'Citizens can only access their own resources'
        });
        return {
            allowed: false,
            error: 'Access denied: You can only access your own resources'
        };
    }
    // Log successful access
    (0, access_control_1.logAccessAttempt)({
        timestamp: new Date().toISOString(),
        userId: user.userId,
        userRole: role,
        resource,
        action,
        resourceId: resourceOwnerId || 'unknown',
        allowed: true
    });
    return { allowed: true };
}
/**
 * Require Role Middleware
 */
function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                error: `Access denied: Required role is one of [${allowedRoles.join(', ')}]`
            });
            return;
        }
        next();
    };
}
//# sourceMappingURL=auth-middleware.js.map