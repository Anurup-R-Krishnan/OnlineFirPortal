import express from 'express';
import { z } from 'zod';
import {
    verifyPassword,
    hashPassword,
    generateTOTPSecret,
    verifyTOTP
} from '../lib/security';
import { sendOTPEmail } from '../lib/email-service';
import {
    getUserByIdentifier,
    createUser,
    getUserById,
    registerUserPublicKey,
    getUserPublicKeys
} from '../lib/db';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    generateMFASecret
} from '../lib/jwt';
import { authenticateToken } from '../lib/auth-middleware';

const router = express.Router();

// Store OTPs temporarily (In production, use Redis)
// Using a simple in-memory map for checking validity
const otpStore = new Map<string, { otp: string; expires: number; attempts: number }>();
const aadhaarOtpStore = new Map<string, { otp: string; expires: number; attempts: number }>();

// Cleanup expired OTPs every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of otpStore.entries()) {
        if (value.expires < now) {
            otpStore.delete(key);
        }
    }
    for (const [key, value] of aadhaarOtpStore.entries()) {
        if (value.expires < now) {
            aadhaarOtpStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

router.post('/aadhaar/request', async (req, res) => {
    try {
        const { aadhaar, email, name } = req.body;

        if (!aadhaar || !email) {
            res.status(400).json({ error: 'Aadhaar and email required' });
            return;
        }

        const aadhaarRegex = /^\d{12}$/;
        if (!aadhaarRegex.test(String(aadhaar).replace(/\s/g, ''))) {
            res.status(400).json({ error: 'Invalid Aadhaar number' });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(email))) {
            res.status(400).json({ error: 'Invalid email format' });
            return;
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const key = `${email}:${aadhaar}`;
        aadhaarOtpStore.set(key, {
            otp: otpCode,
            expires: Date.now() + 10 * 60 * 1000,
            attempts: 0
        });

        const emailResult = await sendOTPEmail(String(email), otpCode, name || 'Citizen');
        if (!emailResult.success) {
            res.status(500).json({ error: 'Failed to send OTP email' });
            return;
        }

        res.json({ success: true, message: 'OTP sent to email' });
    } catch (err: any) {
        console.error('[AADHAAR OTP REQUEST ERROR]', err);
        res.status(500).json({ error: 'Failed to send Aadhaar OTP' });
    }
});

router.post('/aadhaar/verify', async (req, res) => {
    try {
        const { aadhaar, email, otp } = req.body;

        if (!aadhaar || !email || !otp) {
            res.status(400).json({ error: 'Aadhaar, email, and OTP required' });
            return;
        }

        const key = `${email}:${aadhaar}`;
        const stored = aadhaarOtpStore.get(key);
        if (!stored) {
            res.status(401).json({ error: 'OTP expired or not found' });
            return;
        }

        if (stored.expires < Date.now()) {
            aadhaarOtpStore.delete(key);
            res.status(401).json({ error: 'OTP expired' });
            return;
        }

        if (stored.attempts >= 3) {
            aadhaarOtpStore.delete(key);
            res.status(429).json({ error: 'Too many attempts' });
            return;
        }

        if (stored.otp !== String(otp).trim()) {
            stored.attempts += 1;
            aadhaarOtpStore.set(key, stored);
            res.status(401).json({ error: 'Invalid OTP' });
            return;
        }

        aadhaarOtpStore.delete(key);
        res.json({ success: true, message: 'Aadhaar verified' });
    } catch (err: any) {
        console.error('[AADHAAR OTP VERIFY ERROR]', err);
        res.status(500).json({ error: 'Aadhaar OTP verification failed' });
    }
});

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

            // Generate and "Store" OTP, then send via email service
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            otpStore.set(user.id, {
                otp: otpCode,
                expires: Date.now() + 10 * 60 * 1000,
                attempts: 0
            });
            const emailResult = await sendOTPEmail(user.email, otpCode, user.name || 'Citizen');
            if (!emailResult.success) {
                console.warn('[EMAIL SERVICE] OTP email failed:', emailResult.error);
            }

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
// KEY REGISTRY (PUBLIC KEYS)
// ==========================================
router.get('/keys', authenticateToken, (req, res) => {
    try {
        const user = req.user!;
        const keys = getUserPublicKeys(user.userId);
        res.json({ success: true, keys: keys.map((k: any) => ({
            id: k.id,
            publicKey: k.publicKey,
            label: k.label,
            createdAt: k.createdAt
        })) });
    } catch (err: any) {
        console.error('[GET KEYS ERROR]', err);
        res.status(500).json({ error: 'Failed to fetch keys' });
    }
});

router.post('/keys', authenticateToken, (req, res) => {
    try {
        const user = req.user!;
        const { publicKey, label } = req.body;

        if (!publicKey || typeof publicKey !== 'string') {
            res.status(400).json({ error: 'Public key required' });
            return;
        }

        const saved = registerUserPublicKey(user.userId, publicKey, label);
        res.status(201).json({
            success: true,
            key: {
                id: saved.id,
                publicKey: saved.publicKey,
                label: saved.label,
                createdAt: saved.createdAt
            }
        });
    } catch (err: any) {
        console.error('[REGISTER KEY ERROR]', err);
        res.status(500).json({ error: 'Failed to register key' });
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
