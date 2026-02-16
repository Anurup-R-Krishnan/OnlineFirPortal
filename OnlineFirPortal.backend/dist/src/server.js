"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_1 = __importDefault(require("./routes/auth"));
const firs_1 = __importDefault(require("./routes/firs"));
const admin_1 = __importDefault(require("./routes/admin"));
const ipc_1 = __importDefault(require("./routes/ipc"));
const documents_1 = __importDefault(require("./routes/documents"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const security_middleware_1 = require("./lib/security-middleware");
const isTestEnv = process.env.NODE_ENV === 'test' ||
    typeof process.env.JEST_WORKER_ID !== 'undefined' ||
    typeof process.env.BUN_TEST !== 'undefined' ||
    process.argv.includes('test');
if (!isTestEnv) {
    dotenv_1.default.config();
}
exports.app = (0, express_1.default)();
const PORT = process.env.PORT || 4001;
// Global Security Middleware
exports.app.use(security_middleware_1.securityHeaders); // Helmet protection against common vulnerabilities
exports.app.use(security_middleware_1.hppMiddleware); // Prevent HTTP Parameter Pollution
exports.app.use(security_middleware_1.apiLimiter); // Global rate limiting
// Body Parsing
exports.app.use(express_1.default.json({ limit: '10mb' }));
exports.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
exports.app.use((0, cookie_parser_1.default)());
exports.app.use(security_middleware_1.sanitizeInputs); // Basic XSS sanitization
// CORS Middleware
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:4000')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
exports.app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin) {
            callback(null, true);
            return;
        }
        if (corsOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Routes
exports.app.get('/', (req, res) => {
    res.json({ message: 'Online FIR Portal API is running' });
});
// Apply stricter rate limiting to auth routes
exports.app.use('/api/auth', security_middleware_1.authLimiter, auth_1.default);
exports.app.use('/api/firs', firs_1.default);
exports.app.use('/api/admin', admin_1.default);
exports.app.use('/api/ipc', ipc_1.default);
exports.app.use('/api/documents', documents_1.default);
exports.app.use('/api/notifications', notifications_1.default);
// Start Server
if (require.main === module) {
    exports.app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
//# sourceMappingURL=server.js.map