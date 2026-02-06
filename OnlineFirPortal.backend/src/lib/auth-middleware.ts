import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from './jwt';
import { hasPermission, logAccessAttempt, UserRole, Resource, Action } from './access-control';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Authentication Middleware
 * Extracts and verifies JWT token from request (Header or Cookie)
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    let token: string | null = null;

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
    const user = verifyAccessToken(token);
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

  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
}

export function checkPermission(
  user: TokenPayload,
  resource: Resource,
  action: Action,
  resourceOwnerId?: string
): { allowed: boolean; error?: string } {
  const role = user.role as UserRole;

  // Check basic permission
  if (!hasPermission(role, resource, action)) {
    logAccessAttempt({
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
    logAccessAttempt({
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
  logAccessAttempt({
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
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
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

