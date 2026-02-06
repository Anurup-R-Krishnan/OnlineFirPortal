import rateLimit from "express-rate-limit";
import helmet from "helmet";
import hpp from "hpp";
import { type Request, type Response, type NextFunction, type RequestHandler } from "express";

// Rate limiter: 100 requests per 15 minutes per IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again after 15 minutes" }
});

// Stricter limiter for auth routes: 10 requests per hour
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again after an hour" }
});

export const securityHeaders = helmet();

export const hppMiddleware = hpp();

// Custom middleware to sanitize inputs (basic XSS prevention)
// Note: Zod validation handles most of this, but this is an extra layer for raw inputs
export const sanitizeInputs: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].replace(/</g, "&lt;").replace(/>/g, "&gt;");
      }
    }
  }
  next();
};
