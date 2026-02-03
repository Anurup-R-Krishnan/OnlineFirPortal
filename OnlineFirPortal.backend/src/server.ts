import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import firRoutes from './routes/firs';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: 'http://localhost:3000', // Allow frontend
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Online FIR Portal API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/firs', firRoutes);

// Start Server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
