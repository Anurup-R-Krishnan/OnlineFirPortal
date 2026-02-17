import rateLimit from "express-rate-limit";
import helmet from "helmet";
import hpp from "hpp";
import { type Request, type Response, type NextFunction, type RequestHandler } from "express";

const API_RATE_LIMIT_WINDOW_MS = Number(process.env.API_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000);
const API_RATE_LIMIT_MAX = Number(process.env.API_RATE_LIMIT_MAX ?? 500);
const AUTH_RATE_LIMIT_WINDOW_MS = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? 60 * 60 * 1000);
const AUTH_RATE_LIMIT_MAX = Number(process.env.AUTH_RATE_LIMIT_MAX ?? 300);

// Rate limiter
export const apiLimiter = rateLimit({
  windowMs: API_RATE_LIMIT_WINDOW_MS,
  limit: API_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again later" }
});

// Stricter limiter for auth routes
export const authLimiter = rateLimit({
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  limit: AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication requests, please try again later" }
});

export const securityHeaders = helmet();

export const hppMiddleware = hpp();

// Custom middleware to sanitize inputs (basic XSS prevention)
// Note: Zod validation handles most of this, but this is an extra layer for raw inputs
const sanitizeString = (value: string): string => value.replace(/</g, '&lt;').replace(/>/g, '&gt;');

const sanitizeValue = (value: unknown): unknown => {
  if (typeof value === 'string') return sanitizeString(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>)) {
      sanitized[key] = sanitizeValue((value as Record<string, unknown>)[key]);
    }
    return sanitized;
  }
  return value;
};

export const sanitizeInputs: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    const sanitizedQuery = sanitizeValue(req.query) as Request['query'];
    if (req.query && typeof req.query === 'object') {
      for (const key of Object.keys(req.query)) {
        delete (req.query as Record<string, unknown>)[key];
      }
      Object.assign(req.query as Record<string, unknown>, sanitizedQuery as Record<string, unknown>);
    }
  }
  if (req.params) {
    const sanitizedParams = sanitizeValue(req.params) as Request['params'];
    if (req.params && typeof req.params === 'object') {
      for (const key of Object.keys(req.params)) {
        delete (req.params as Record<string, unknown>)[key];
      }
      Object.assign(req.params as Record<string, unknown>, sanitizedParams as Record<string, unknown>);
    }
  }
  next();
};
