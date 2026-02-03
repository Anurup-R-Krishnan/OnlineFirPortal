"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const security_1 = require("../lib/security");
const db_1 = require("../lib/db");
const jwt_1 = require("../lib/jwt");
const router = express_1.default.Router();
// Store OTPs temporarily (In production, use Redis)
// Using a simple in-memory map for checking validity
const otpStore = new Map();
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
        const { name, email, mobile, password, aadhaar, role, policeStation, badgeNumber, mfaEnabled } = req.body;
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
        const existingUser = (0, db_1.getUserByIdentifier)(email);
        if (existingUser) {
            res.status(409).json({ error: 'User with this email or mobile already exists' });
            return;
        }
        // Hash Password
        const { hash, salt } = await (0, security_1.hashPassword)(password);
        // MFA Secret
        const mfaSecret = mfaEnabled ? (0, jwt_1.generateMFASecret)() : undefined;
        const user = (0, db_1.createUser)({
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
    }
    catch (err) {
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
        const sanitizedEmail = email.trim().toLowerCase();
        const user = (0, db_1.getUserByIdentifier)(sanitizedEmail);
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        const isValid = await (0, security_1.verifyPassword)(password, user.passwordHash, user.passwordSalt);
        if (!isValid) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }
        // MFA Check
        if (user.mfaEnabled && user.mfaSecret) {
            // Generate Temp Token for MFA step
            const tempToken = (0, jwt_1.generateAccessToken)({
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
        const accessToken = (0, jwt_1.generateAccessToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
            mfaVerified: true
        });
        const refreshToken = (0, jwt_1.generateRefreshToken)(user.id);
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
    }
    catch (err) {
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
        const payload = (0, jwt_1.verifyAccessToken)(tempToken);
        if (!payload || payload.mfaVerified) {
            // if it's already verified, or invalid
            res.status(401).json({ error: 'Invalid or expired temporary token' });
            return;
        }
        const user = (0, db_1.getUserById)(payload.userId);
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
                res.status(401).json({ error: 'OTP expired' });
                return;
            }
            if (storedOTP.otp === otp.trim()) {
                isVerified = true;
                otpStore.delete(user.id);
            }
        }
        else if (user.mfaSecret) {
            // Fallback to TOTP check
            isVerified = await (0, security_1.verifyTOTP)(otp, user.mfaSecret);
        }
        else {
            res.status(401).json({ error: 'OTP expired or not found' });
            return;
        }
        if (!isVerified) {
            res.status(401).json({ error: 'Invalid OTP' });
            return;
        }
        // Success
        const accessToken = (0, jwt_1.generateAccessToken)({
            userId: user.id,
            email: user.email,
            role: user.role,
            mfaVerified: true
        });
        const refreshToken = (0, jwt_1.generateRefreshToken)(user.id);
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
    }
    catch (err) {
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
        const payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
        if (!payload) {
            res.status(401).json({ error: 'Invalid or expired refresh token' });
            return;
        }
        const user = (0, db_1.getUserById)(payload.userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const accessToken = (0, jwt_1.generateAccessToken)({
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
    }
    catch (err) {
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
exports.default = router;
//# sourceMappingURL=auth.js.map