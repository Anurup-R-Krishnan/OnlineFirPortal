import { Request, Response, NextFunction } from 'express';
import { TokenPayload } from './jwt';
import { UserRole, Resource, Action } from './access-control';
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
export declare function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function checkPermission(user: TokenPayload, resource: Resource, action: Action, resourceOwnerId?: string): {
    allowed: boolean;
    error?: string;
};
/**
 * Require Role Middleware
 */
export declare function requireRole(allowedRoles: UserRole[]): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth-middleware.d.ts.map