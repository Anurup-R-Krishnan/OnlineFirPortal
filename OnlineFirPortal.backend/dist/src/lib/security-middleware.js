"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInputs = exports.hppMiddleware = exports.securityHeaders = exports.authLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const hpp_1 = __importDefault(require("hpp"));
// Rate limiter: 100 requests per 15 minutes per IP
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests from this IP, please try again after 15 minutes" }
});
// Stricter limiter for auth routes: 100 requests per hour
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many login attempts, please try again after an hour" }
});
exports.securityHeaders = (0, helmet_1.default)();
exports.hppMiddleware = (0, hpp_1.default)();
// Custom middleware to sanitize inputs (basic XSS prevention)
// Note: Zod validation handles most of this, but this is an extra layer for raw inputs
const sanitizeString = (value) => value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
const sanitizeValue = (value) => {
    if (typeof value === 'string')
        return sanitizeString(value);
    if (Array.isArray(value))
        return value.map(sanitizeValue);
    if (value && typeof value === 'object') {
        const sanitized = {};
        for (const key of Object.keys(value)) {
            sanitized[key] = sanitizeValue(value[key]);
        }
        return sanitized;
    }
    return value;
};
const sanitizeInputs = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeValue(req.body);
    }
    if (req.query) {
        const sanitizedQuery = sanitizeValue(req.query);
        if (req.query && typeof req.query === 'object') {
            for (const key of Object.keys(req.query)) {
                delete req.query[key];
            }
            Object.assign(req.query, sanitizedQuery);
        }
    }
    if (req.params) {
        const sanitizedParams = sanitizeValue(req.params);
        if (req.params && typeof req.params === 'object') {
            for (const key of Object.keys(req.params)) {
                delete req.params[key];
            }
            Object.assign(req.params, sanitizedParams);
        }
    }
    next();
};
exports.sanitizeInputs = sanitizeInputs;
//# sourceMappingURL=security-middleware.js.map