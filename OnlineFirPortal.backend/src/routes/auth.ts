import express from 'express';
import { z } from 'zod';
import {
    verifyPassword,
    hashPassword,
    generateTOTPSecret,
    verifyTOTP
} from '../lib/security';
import {
    getUserByIdentifier,
    createUser,
    getUserById
} from '../lib/db';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    generateMFASecret
} from '../lib/jwt';

const router = express.Router();

// Store OTPs temporarily (In production, use Redis)
// Using a simple in-memory map for checking validity
const otpStore = new Map<string, { otp: string; expires: number; attempts: number }>();

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of otpStore.entries()) {
        if (value.expires < now) {
            otpStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

// ==========================================
// REGISTER
// ==========================================
router.post('/register', async (req, res) => {
    try {
        const { name, email, mobile, password, aadhaar, role, policeStation, badgeNumber, mfaEnabled, mfaSecret: requestMfaSecret } = req.body;

        // Basic Validation
        if (!name || !email || !mobile || !password) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Email Regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({ error: 'Invalid email format' });
            return;
        }

        // Mobile Regex (Indian)
        const mobileRegex = /^[6-9]\d{9}$/;
        if (!mobileRegex.test(mobile.replace(/\s/g, ''))) {
            res.status(400).json({ error: 'Invalid mobile number' });
            return;
        }

        // Check existence
        const existingUser = getUserByIdentifier(email);
        if (existingUser) {
            res.status(409).json({ error: 'User with this email or mobile already exists' });
            return;
        }

        // Hash Password
        const { hash, salt } = await hashPassword(password);

        // MFA Secret
        const mfaSecret = mfaEnabled ? (requestMfaSecret || generateMFASecret()) : undefined;

        const user = createUser({
            name,
            email,
            mobile,
            aadhaar,
            role: role || 'citizen',
            passwordHash: hash,
            passwordSalt: salt,
            policeStation,
            badgeNumber,
            mfaEnabled: mfaEnabled || false,
            mfaSecret
        });

        // Strip sensitive data
        const { passwordHash, passwordSalt, mfaSecret: secret, ...safeUser } = user;

        res.status(201).json({
            success: true,
            user: safeUser,
            message: 'Registration successful'
        });

    } catch (err: any) {
        console.error('[REGISTER ERROR]', err);
        res.status(400).json({ error: err.message || 'Registration failed' });
    }
});

// ==========================================
// LOGIN
// ==========================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email/Identifier and password required' });
            return;
        }

        const identifier = email.trim().toLowerCase();
        const normalizedMobile = identifier.replace(/\s+/g, '').replace(/^\+?91/, '').replace(/^0+/, '');
        let user = getUserByIdentifier(identifier);
        if (!user && normalizedMobile !== identifier) {
            user = getUserByIdentifier(normalizedMobile);
        }

        if (!user) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        const isValid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
        if (!isValid) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        // MFA Check
        if (user.mfaEnabled && user.mfaSecret) {

            // Generate Temp Token for MFA step
            const tempToken = generateAccessToken({
                userId: user.id,
                email: user.email,
                role: user.role,
                mfaVerified: false // Not yet verified
            });

            // Generate and "Store" OTP (Simulate sending email)
            // In a real app, send this via emailService
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            otpStore.set(user.id, {
                otp: otpCode,
                expires: Date.now() + 10 * 60 * 1000,
                attempts: 0
            });
            console.log(`[DEV] Generated OTP for ${user.email}: ${otpCode}`);

            const { passwordHash, passwordSalt, ...userWithMfa } = user;
            res.json({
                ...userWithMfa,
                mfaEnabled: true,
                tempToken,
                message: 'MFA required. OTP sent.'
            });
            return;
        }

        // Generate Tokens
        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            mfaVerified: true
        });
        const refreshToken = generateRefreshToken(user.id);

        const { passwordHash, passwordSalt, mfaSecret, ...safeUser } = user;

        // Set Cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 mins
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            success: true,
            user: safeUser,
            accessToken,
            message: 'Login successful'
        });

    } catch (err: any) {
        console.error('[LOGIN ERROR]', err);
        res.status(500).json({ error: 'An error occurred during login.' });
    }
});


// ==========================================
// VERIFY MFA
// ==========================================
router.post('/verify-mfa', async (req, res) => {
    try {
        const { tempToken, otp } = req.body;

        if (!tempToken || !otp) {
            res.status(400).json({ error: 'Temporary token and OTP required' });
            return;
        }

        const payload = verifyAccessToken(tempToken);
        if (!payload || payload.mfaVerified) {
            // if it's already verified, or invalid
            res.status(401).json({ error: 'Invalid or expired temporary token' });
            return;
        }

        const user = getUserById(payload.userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // CHECK OTP STORE (Email OTP flow)
        const storedOTP = otpStore.get(user.id);
        let isVerified = false;

        if (storedOTP) {
            if (storedOTP.expires < Date.now()) {
                otpStore.delete(user.id);
            } else if (storedOTP.otp === otp.trim()) {
                isVerified = true;
                otpStore.delete(user.id);
            }
        }

        if (!isVerified && user.mfaSecret) {
            // Fallback to TOTP check
            isVerified = await verifyTOTP(otp, user.mfaSecret);
        }

        if (!isVerified) {
            res.status(401).json({ error: 'Invalid OTP' });
            return;
        }

        // Success
        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            mfaVerified: true
        });
        const refreshToken = generateRefreshToken(user.id);

        const { passwordHash, passwordSalt, mfaSecret, ...safeUser } = user;

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            success: true,
            user: safeUser,
            accessToken,
            message: 'MFA verification successful'
        });

    } catch (err: any) {
        console.error('[MFA VERIFY ERROR]', err);
        res.status(500).json({ error: 'An error occurred during verification.' });
    }
});

// ==========================================
// REFRESH
// ==========================================
router.post('/refresh', async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!refreshToken) {
            res.status(400).json({ error: 'Refresh token required' });
            return;
        }

        const payload = verifyRefreshToken(refreshToken);
        if (!payload) {
            res.status(401).json({ error: 'Invalid or expired refresh token' });
            return;
        }

        const user = getUserById(payload.userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            mfaVerified: true
        });

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000
        });

        res.json({
            success: true,
            accessToken,
            message: 'Token refreshed successfully'
        });

    } catch (err: any) {
        console.error('[REFRESH ERROR]', err);
        res.status(500).json({ error: 'Refresh failed' });
    }
});

// ==========================================
// LOGOUT
// ==========================================
router.post('/logout', (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
