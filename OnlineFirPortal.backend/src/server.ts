import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import firRoutes from './routes/firs';
import adminRoutes from './routes/admin';
import ipcRoutes from './routes/ipc';
import documentRoutes from './routes/documents';
import { securityHeaders, apiLimiter, authLimiter, hppMiddleware, sanitizeInputs } from './lib/security-middleware';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 3001;

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
app.use(cors({
    origin: 'http://localhost:3000', // Allow frontend
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

// Start Server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
