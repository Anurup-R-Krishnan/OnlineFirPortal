import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './lib/env';
import authRoutes from './routes/auth';
import firRoutes from './routes/firs';
import adminRoutes from './routes/admin';
import ipcRoutes from './routes/ipc';
import documentRoutes from './routes/documents';
import notificationRoutes from './routes/notifications';
import securityLabRoutes from './routes/security-lab';
import jurisdictionRoutes from './routes/jurisdiction';
import { securityHeaders, apiLimiter, authLimiter, hppMiddleware, sanitizeInputs } from './lib/security-middleware';

export const app = express();
const PORT = env.port;

// Global Security Middleware
app.use(securityHeaders); // Helmet protection against common vulnerabilities
app.use(hppMiddleware);   // Prevent HTTP Parameter Pollution
app.use(apiLimiter);      // Global rate limiting

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(sanitizeInputs);  // Basic XSS sanitization

// CORS Middleware
const corsOrigins = env.corsOrigin
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(cors({
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
app.get('/', (req, res) => {
    res.json({ message: 'Online FIR Portal API is running' });
});

// Apply stricter rate limiting to auth routes
app.use('/api/auth', authLimiter, authRoutes);

app.use('/api/firs', firRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ipc', ipcRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/security-lab', securityLabRoutes);
app.use('/api/jurisdiction', jurisdictionRoutes);

// Station Module Routes
import evidenceRoutes from './routes/evidence';
import criminalRoutes from './routes/criminals';
import rosterRoutes from './routes/roster';

app.use('/api/evidence', evidenceRoutes);
app.use('/api/criminals', criminalRoutes);
app.use('/api/roster', rosterRoutes);

// Start Server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
