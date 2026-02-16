/**
 * authentication routes - government-grade security
 * google authenticator mfa, account lockout, audit logging
 */

import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { hashPassword, verifyPassword } from '../lib/security';
import { generateTOTPSecret, verifyTOTP, generateRecoveryCodes } from '../lib/totp-service';
import {
    validatePasswordStrength,
    checkPasswordHistory,
    updatePasswordHistory,
    createPasswordResetRequest,
    verifyResetToken,
    markResetTokenUsed,
} from '../lib/password-service';
import {
    checkRateLimit,
    trackFailedLogin,
    resetFailedLoginAttempts,
    isAccountLocked,
    isValidEmail,
    isValidMobile,
    normalizeMobile,
    sanitizeInput,
} from '../lib/security';

/**
 * mock aadhaar verification (uidai integration simulation)
 * in production, this would call uidai api with consent artifact
 */
async function verifyAadhaar(aadhaarNumber: string): Promise<boolean> {
    // 12 digit verhoeff algorithm check is standard, but for simulation:
    // check length and ensure not all zeros
    const cleanNum = aadhaarNumber.replace(/\s/g, '');
    return /^\d{12}$/.test(cleanNum) && cleanNum !== '000000000000';
}

import { createSession, verifySession, revokeSession, revokeAllUserSessions } from '../lib/session-service';
import { logAudit, logAuthAttempt } from '../lib/audit-logger';
import { generateAccessToken, generateRefreshToken, verifyAccessToken } from '../lib/jwt';
import { authenticateToken } from '../lib/auth-middleware';
import { createHash } from 'crypto';

const router = express.Router();

const getIp = (req: express.Request): string => req.ip || req.socket.remoteAddress || 'unknown';
const getUserAgent = (req: express.Request): string => req.headers['user-agent'] || 'unknown';

// ==========================================
// aadhaar otp storage (in-memory for development)
// ==========================================
const aadhaarOtpStore = new Map<string, { otp: string; expiresAt: number }>();
const OTP_EXPIRY_MS = 60 * 1000; // 1 minute

function generateNumericOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function cleanupExpiredOtps(): void {
    const now = Date.now();
    for (const [aadhaar, data] of aadhaarOtpStore.entries()) {
        if (data.expiresAt < now) {
            aadhaarOtpStore.delete(aadhaar);
        }
    }
}

// ==========================================
// mfa setup during registration (before user creation)
// ==========================================
router.post('/setup-mfa-registration', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ error: 'email required for mfa setup' });
            return;
        }

        // generate totp secret and qr code
        const totpSetup = await generateTOTPSecret(email);

        res.json({
            success: true,
            qrCode: totpSetup.qrCode,
            manualEntryKey: totpSetup.manualEntryKey,
            secret: totpSetup.secret, // frontend will send this back with registration
            message: 'scan qr code with google authenticator app',
        });
    } catch (error: any) {
        console.error('[mfa registration setup error]', error);
        res.status(500).json({ error: 'mfa setup failed' });
    }
});

// ==========================================
// citizen registration (public)
// ==========================================
router.post('/register', async (req, res) => {
    try {
        const ipAddress = getIp(req);
        const userAgent = getUserAgent(req);

        // rate limiting
        if (!checkRateLimit(ipAddress || 'unknown')) {
            res.status(429).json({ error: 'too many requests, please try again later' });
            return;
        }

        const { name, email, mobile, password, aadhaar, mfaSecret, totp } = req.body;

        // validation
        if (!name || !email || !mobile || !password) {
            res.status(400).json({ error: 'missing required fields' });
            return;
        }

        // mfa is now required during registration
        if (!mfaSecret || !totp) {
            res.status(400).json({ error: 'mfa setup required - missing secret or totp code' });
            return;
        }

        // verify totp before creating user
        const isTotpValid = verifyTOTP(totp, mfaSecret);
        if (!isTotpValid) {
            res.status(401).json({ error: 'invalid totp code - please try again' });
            return;
        }

        if (aadhaar) {
            const isAadhaarValid = await verifyAadhaar(aadhaar);
            if (!isAadhaarValid) {
                res.status(400).json({ error: 'invalid aadhaar number supplied' });
                return;
            }
        }

        const normalizedEmail = sanitizeInput(email.trim().toLowerCase());
        const normalizedMobile = normalizeMobile(mobile);

        if (!isValidEmail(normalizedEmail)) {
            res.status(400).json({ error: 'invalid email format' });
            return;
        }

        if (!isValidMobile(normalizedMobile)) {
            res.status(400).json({ error: 'invalid mobile number' });
            return;
        }

        // password strength validation
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.valid) {
            res.status(400).json({ error: 'weak password', details: passwordValidation.errors });
            return;
        }

        // check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: normalizedEmail },
                    { mobile: normalizedMobile },
                ],
            },
        });

        if (existingUser) {
            res.status(409).json({ error: 'user with this email or mobile already exists' });
            return;
        }

        // hash password
        const { hash, salt } = await hashPassword(password);

        // generate recovery codes
        const recoveryCodes = generateRecoveryCodes();
        const hashedCodes = recoveryCodes.map(code => ({
            codeHash: createHash('sha256').update(code).digest('hex'),
        }));

        // create user with mfa enabled (citizens only for public registration)
        const user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    name: sanitizeInput(name),
                    email: normalizedEmail,
                    mobile: normalizedMobile,
                    aadhaar: aadhaar ? sanitizeInput(aadhaar) : null,
                    role: 'CITIZEN',
                    passwordHash: hash,
                    passwordSalt: salt,
                    mfaEnabled: true,
                    mfaSecret: mfaSecret,
                    mfaSetupAt: new Date(),
                    forceMfaSetup: false,
                    accountStatus: 'ACTIVE',
                },
            });

            // create recovery codes
            await tx.mFARecoveryCode.createMany({
                data: hashedCodes.map(code => ({
                    ...code,
                    userId: newUser.id,
                })),
            });

            return newUser;
        });

        // log registration
        await logAudit({
            userId: user.id,
            userRole: user.role,
            userName: user.name,
            action: 'REGISTER',
            ipAddress,
            userAgent,
            changes: { mfaEnabled: true },
        });

        res.status(201).json({
            success: true,
            message: 'registration successful with mfa enabled',
            userId: user.id,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
            },
            recoveryCodes, // return recovery codes to user
        });
    } catch (error: any) {
        console.error('[registration error]', error);
        res.status(500).json({ error: 'registration failed' });
    }
});

// ==========================================
// aadhaar verification routes (step 1 of registration)
// ==========================================
router.post('/aadhaar/request', async (req, res) => {
    try {
        const { aadhaar } = req.body;

        if (!aadhaar || !/^\d{12}$/.test(aadhaar.replace(/\s/g, ''))) {
            res.status(400).json({ error: 'invalid aadhaar number format' });
            return;
        }

        // in production: call uidai/asa api to trigger otp to linked mobile
        // const response = await uidai.sendOtp(aadhaar);

        // generate random otp and store it
        cleanupExpiredOtps();
        const otp = generateNumericOTP();
        const expiresAt = Date.now() + OTP_EXPIRY_MS;
        aadhaarOtpStore.set(aadhaar, { otp, expiresAt });

        // log to terminal
        console.log('\n=================================================');
        console.log(`[AADHAAR OTP] For ${aadhaar}: ${otp}`);
        console.log(`[AADHAAR OTP] Expires at: ${new Date(expiresAt).toLocaleTimeString()}`);
        console.log('=================================================\n');

        res.json({
            success: true,
            message: 'verification code sent to linked mobile number'
        });

    } catch (error) {
        console.error('[aadhaar request error]', error);
        res.status(500).json({ error: 'failed to send verification code' });
    }
});

router.post('/aadhaar/verify', async (req, res) => {
    try {
        const { aadhaar, otp } = req.body;

        if (!aadhaar || !otp) {
            res.status(400).json({ error: 'aadhaar and otp required' });
            return;
        }

        // in production: verify otp with uidai
        // const verified = await uidai.verifyOtp(aadhaar, otp);

        // verify against stored otp
        cleanupExpiredOtps();
        const storedData = aadhaarOtpStore.get(aadhaar);

        if (!storedData) {
            res.status(400).json({ error: 'otp expired or not requested' });
            return;
        }

        if (Date.now() > storedData.expiresAt) {
            aadhaarOtpStore.delete(aadhaar);
            res.status(400).json({ error: 'otp has expired' });
            return;
        }

        if (otp !== storedData.otp) {
            res.status(400).json({ error: 'invalid otp' });
            return;
        }

        // clear otp after successful verification
        aadhaarOtpStore.delete(aadhaar);

        res.json({
            success: true,
            message: 'aadhaar verified successfully',
            verified: true
        });

    } catch (error) {
        console.error('[aadhaar verify error]', error);
        res.status(500).json({ error: 'verification failed' });
    }
});

// ==========================================
// login step 1: credentials
// ==========================================
router.post('/login', async (req, res) => {
    try {
        const ipAddress = getIp(req);
        const userAgent = getUserAgent(req);

        // rate limiting
        if (!checkRateLimit(ipAddress || 'unknown')) {
            res.status(429).json({ error: 'too many requests, please try again later' });
            return;
        }

        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'email and password required' });
            return;
        }

        const identifier = email.trim().toLowerCase();
        const normalizedMobile = normalizeMobile(identifier);

        // find user by email or mobile
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { mobile: identifier },
                    { mobile: normalizedMobile },
                ],
            },
        });

        if (!user) {
            await logAuthAttempt(identifier, false, ipAddress, userAgent, 'user not found');
            res.status(401).json({ error: 'invalid credentials' });
            return;
        }

        // check if account is locked
        const locked = await isAccountLocked(user.id);
        if (locked) {
            await logAuthAttempt(user.email, false, ipAddress, userAgent, 'account locked');
            res.status(403).json({
                error: 'account locked due to multiple failed login attempts',
                lockedUntil: user.lockedUntil,
            });
            return;
        }

        // verify password
        const isValid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
        if (!isValid) {
            const result = await trackFailedLogin(user.id, user.email, ipAddress, userAgent);

            if (result.locked) {
                res.status(403).json({
                    error: 'account locked due to multiple failed login attempts',
                    message: 'please contact admin to unlock your account',
                });
            } else {
                res.status(401).json({
                    error: 'invalid credentials',
                    attemptsRemaining: result.attemptsRemaining,
                });
            }
            return;
        }

        // reset failed attempts
        await resetFailedLoginAttempts(user.id);

        // check if password change required
        if (user.forcePasswordChange) {
            const tempToken = generateAccessToken({
                userId: user.id,
                email: user.email,
                role: user.role,
                mfaVerified: false,
                passwordChangeRequired: true,
            });

            res.json({
                requiresPasswordChange: true,
                tempToken,
                message: 'password change required',
            });
            return;
        }

        // check if mfa setup required
        if (user.forceMfaSetup || !user.mfaEnabled) {
            const tempToken = generateAccessToken({
                userId: user.id,
                email: user.email,
                role: user.role,
                mfaVerified: false,
                mfaSetupRequired: true,
            });

            res.json({
                requiresMfaSetup: true,
                tempToken,
                message: 'mfa setup required',
            });
            return;
        }

        // mfa enabled, require totp
        const tempToken = generateAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            mfaVerified: false,
        });

        await logAuthAttempt(user.email, true, ipAddress, userAgent);

        res.json({
            requiresMfa: true,
            tempToken,
            message: 'enter totp code from google authenticator',
        });
    } catch (error: any) {
        console.error('[login error]', error);
        res.status(500).json({ error: 'login failed' });
    }
});

// ==========================================
// setup mfa (google authenticator)
// ==========================================
router.post('/setup-mfa', authenticateToken, async (req, res) => {
    try {
        const userId = req.user!.userId;
        const ipAddress = getIp(req);

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            res.status(404).json({ error: 'user not found' });
            return;
        }

        // generate totp secret and qr code
        const totpSetup = await generateTOTPSecret(user.email);

        // save secret to database
        await prisma.user.update({
            where: { id: userId },
            data: {
                mfaSecret: totpSetup.secret,
            },
        });

        await logAudit({
            userId,
            userRole: user.role,
            userName: user.name,
            action: 'MFA_SETUP',
            ipAddress,
        });

        res.json({
            success: true,
            qrCode: totpSetup.qrCode,
            manualEntryKey: totpSetup.manualEntryKey,
            message: 'scan qr code with google authenticator app',
        });
    } catch (error: any) {
        console.error('[mfa setup error]', error);
        res.status(500).json({ error: 'mfa setup failed' });
    }
});

// ==========================================
// verify totp and complete mfa setup
// ==========================================
router.post('/verify-totp-setup', authenticateToken, async (req, res) => {
    try {
        const userId = req.user!.userId;
        const { totp } = req.body;
        const ipAddress = getIp(req);

        if (!totp) {
            res.status(400).json({ error: 'totp code required' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.mfaSecret) {
            res.status(400).json({ error: 'mfa not setup' });
            return;
        }

        // verify totp
        const isValid = verifyTOTP(totp, user.mfaSecret);
        if (!isValid) {
            res.status(401).json({ error: 'invalid totp code' });
            return;
        }

        // generate recovery codes
        const recoveryCodes = generateRecoveryCodes();
        const hashedCodes = recoveryCodes.map(code => ({
            codeHash: createHash('sha256').update(code).digest('hex'),
            userId,
        }));

        // save recovery codes and enable mfa
        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: {
                    mfaEnabled: true,
                    forceMfaSetup: false,
                    mfaSetupAt: new Date(),
                },
            }),
            prisma.mFARecoveryCode.createMany({
                data: hashedCodes,
            }),
        ]);

        await logAudit({
            userId,
            userRole: user.role,
            userName: user.name,
            action: 'MFA_SETUP',
            ipAddress,
            changes: { mfaEnabled: true },
        });

        res.json({
            success: true,
            recoveryCodes,
            message: 'mfa enabled successfully, save recovery codes in a safe place',
        });
    } catch (error: any) {
        console.error('[totp verification error]', error);
        res.status(500).json({ error: 'totp verification failed' });
    }
});

// ==========================================
// verify totp during login
// ==========================================
router.post('/verify-totp', async (req, res) => {
    try {
        const { tempToken, totp } = req.body;
        const ipAddress = getIp(req);
        const userAgent = getUserAgent(req);

        if (!tempToken || !totp) {
            res.status(400).json({ error: 'temp token and totp required' });
            return;
        }

        const payload = verifyAccessToken(tempToken);
        if (!payload || payload.mfaVerified) {
            res.status(401).json({ error: 'invalid or expired token' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
        });

        if (!user || !user.mfaSecret) {
            res.status(400).json({ error: 'mfa not enabled' });
            return;
        }

        // verify totp
        const isValid = verifyTOTP(totp, user.mfaSecret);
        if (!isValid) {
            await logAudit({
                userId: user.id,
                userRole: user.role,
                userName: user.name,
                action: 'MFA_VERIFY',
                ipAddress,
                success: false,
                errorMessage: 'invalid totp',
            });

            res.status(401).json({ error: 'invalid totp code' });
            return;
        }

        // generate session and tokens
        const sessionToken = await createSession(user.id, ipAddress, userAgent);
        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            mfaVerified: true,
        });
        const refreshToken = generateRefreshToken(user.id);

        await logAudit({
            userId: user.id,
            userRole: user.role,
            userName: user.name,
            action: 'LOGIN_SUCCESS',
            ipAddress,
            userAgent,
        });

        // set cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({
            success: true,
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            message: 'login successful',
        });
    } catch (error: any) {
        console.error('[totp verification error]', error);
        res.status(500).json({ error: 'verification failed' });
    }
});

// ==========================================
// verify recovery code
// ==========================================
router.post('/verify-recovery-code', async (req, res) => {
    try {
        const { tempToken, recoveryCode } = req.body;
        const ipAddress = getIp(req);
        const userAgent = getUserAgent(req);

        if (!tempToken || !recoveryCode) {
            res.status(400).json({ error: 'temp token and recovery code required' });
            return;
        }

        const payload = verifyAccessToken(tempToken);
        if (!payload || payload.mfaVerified) {
            res.status(401).json({ error: 'invalid or expired token' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
        });

        if (!user) {
            res.status(404).json({ error: 'user not found' });
            return;
        }

        // hash the provided recovery code
        const codeHash = createHash('sha256').update(recoveryCode.trim()).digest('hex');

        // find unused recovery code
        const recoveryCodeRecord = await prisma.mFARecoveryCode.findFirst({
            where: {
                userId: user.id,
                codeHash,
                used: false,
            },
        });

        if (!recoveryCodeRecord) {
            await logAudit({
                userId: user.id,
                userRole: user.role,
                userName: user.name,
                action: 'MFA_VERIFY',
                ipAddress,
                success: false,
                errorMessage: 'invalid recovery code',
            });

            res.status(401).json({ error: 'invalid or already used recovery code' });
            return;
        }

        // mark recovery code as used
        await prisma.mFARecoveryCode.update({
            where: { id: recoveryCodeRecord.id },
            data: {
                used: true,
                usedAt: new Date(),
            },
        });

        // generate session and tokens
        const sessionToken = await createSession(user.id, ipAddress, userAgent);
        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            mfaVerified: true,
        });
        const refreshToken = generateRefreshToken(user.id);

        await logAudit({
            userId: user.id,
            userRole: user.role,
            userName: user.name,
            action: 'LOGIN_SUCCESS',
            ipAddress,
            userAgent,
            changes: { method: 'recovery_code' },
        });

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000,
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({
            success: true,
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            message: 'login successful using recovery code',
            warning: 'recovery code has been used, generate new codes if running low',
        });
    } catch (error: any) {
        console.error('[recovery code verification error]', error);
        res.status(500).json({ error: 'verification failed' });
    }
});

// ==========================================
// request password reset
// ==========================================
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const ipAddress = getIp(req);

        if (!email) {
            res.status(400).json({ error: 'email required' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { email: email.trim().toLowerCase() },
        });

        // always return success to prevent email enumeration
        if (!user) {
            res.json({
                success: true,
                message: 'if email exists, password reset instructions have been sent',
            });
            return;
        }

        // create reset token
        const token = await createPasswordResetRequest(user.id);

        await logAudit({
            userId: user.id,
            userRole: user.role,
            userName: user.name,
            action: 'PASSWORD_RESET_REQUEST',
            ipAddress,
        });

        // in production, send email with token
        // for now, just log it (only in development)
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[password reset] token for ${user.email}: ${token}`);
        }

        res.json({
            success: true,
            message: user.role === 'CITIZEN'
                ? 'password reset request submitted, admin approval required'
                : 'password reset instructions sent',
        });
    } catch (error: any) {
        console.error('[password reset request error]', error);
        res.status(500).json({ error: 'password reset request failed' });
    }
});

// ==========================================
// reset password with token
// ==========================================
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const ipAddress = getIp(req);

        if (!token || !newPassword) {
            res.status(400).json({ error: 'token and new password required' });
            return;
        }

        // validate password strength
        const passwordValidation = validatePasswordStrength(newPassword);
        if (!passwordValidation.valid) {
            res.status(400).json({ error: 'weak password', details: passwordValidation.errors });
            return;
        }

        // verify token
        const verification = await verifyResetToken(token);
        if (!verification.valid) {
            if (verification.requiresApproval) {
                res.status(403).json({ error: 'password reset requires admin approval' });
            } else {
                res.status(401).json({ error: 'invalid or expired token' });
            }
            return;
        }

        if (!verification.userId) {
            res.status(401).json({ error: 'invalid token' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: verification.userId },
        });

        if (!user) {
            res.status(404).json({ error: 'user not found' });
            return;
        }

        // hash new password
        const { hash, salt } = await hashPassword(newPassword);

        // check password history
        if (!checkPasswordHistory(hash, user.passwordHistory || undefined)) {
            res.status(400).json({ error: 'cannot reuse recent passwords' });
            return;
        }

        // update password
        const newHistory = updatePasswordHistory(hash, user.passwordHistory || undefined);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: hash,
                passwordSalt: salt,
                passwordHistory: newHistory,
                passwordChangedAt: new Date(),
                forcePasswordChange: false,
            },
        });

        // mark token as used
        await markResetTokenUsed(token);

        // revoke all sessions
        await revokeAllUserSessions(user.id);

        await logAudit({
            userId: user.id,
            userRole: user.role,
            userName: user.name,
            action: 'PASSWORD_RESET',
            ipAddress,
        });

        res.json({
            success: true,
            message: 'password reset successful, please login with new password',
        });
    } catch (error: any) {
        console.error('[password reset error]', error);
        res.status(500).json({ error: 'password reset failed' });
    }
});

// ==========================================
// change password (authenticated)
// ==========================================
router.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const userId = req.user!.userId;
        const { currentPassword, newPassword } = req.body;
        const ipAddress = getIp(req);

        if (!currentPassword || !newPassword) {
            res.status(400).json({ error: 'current and new password required' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            res.status(404).json({ error: 'user not found' });
            return;
        }

        // verify current password
        const isValid = await verifyPassword(currentPassword, user.passwordHash, user.passwordSalt);
        if (!isValid) {
            res.status(401).json({ error: 'current password incorrect' });
            return;
        }

        // validate new password strength
        const passwordValidation = validatePasswordStrength(newPassword);
        if (!passwordValidation.valid) {
            res.status(400).json({ error: 'weak password', details: passwordValidation.errors });
            return;
        }

        // hash new password
        const { hash, salt } = await hashPassword(newPassword);

        // check password history
        if (!checkPasswordHistory(hash, user.passwordHistory || undefined)) {
            res.status(400).json({ error: 'cannot reuse recent passwords' });
            return;
        }

        // update password
        const newHistory = updatePasswordHistory(hash, user.passwordHistory || undefined);
        await prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash: hash,
                passwordSalt: salt,
                passwordHistory: newHistory,
                passwordChangedAt: new Date(),
                forcePasswordChange: false,
            },
        });

        await logAudit({
            userId,
            userRole: user.role,
            userName: user.name,
            action: 'PASSWORD_CHANGE',
            ipAddress,
        });

        res.json({
            success: true,
            message: 'password changed successfully',
        });
    } catch (error: any) {
        console.error('[password change error]', error);
        res.status(500).json({ error: 'password change failed' });
    }
});

// ==========================================
// logout
// ==========================================
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        const userId = req.user!.userId;
        const sessionToken = req.cookies.refreshToken;

        if (sessionToken) {
            await revokeSession(sessionToken);
        }

        await logAudit({
            userId,
            action: 'LOGOUT',
        });

        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        res.json({
            success: true,
            message: 'logged out successfully',
        });
    } catch (error: any) {
        console.error('[logout error]', error);
        res.status(500).json({ error: 'logout failed' });
    }
});

// ==========================================
// refresh token
// ==========================================
router.post('/refresh', async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!refreshToken) {
            res.status(400).json({ error: 'refresh token required' });
            return;
        }

        const session = await verifySession(refreshToken);
        if (!session.valid || !session.userId) {
            res.status(401).json({ error: 'invalid or expired refresh token' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: session.userId },
        });

        if (!user) {
            res.status(404).json({ error: 'user not found' });
            return;
        }

        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            mfaVerified: true,
        });

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000,
        });

        res.json({
            success: true,
            accessToken,
        });
    } catch (error: any) {
        console.error('[refresh error]', error);
        res.status(500).json({ error: 'token refresh failed' });
    }
});

// ==========================================
// register public key (alias for /keys endpoint)
// ==========================================
router.post('/keys', authenticateToken, async (req, res) => {
    try {
        const userId = req.user!.userId;
        const { publicKey, label } = req.body;

        if (!publicKey || typeof publicKey !== 'string') {
            res.status(400).json({ error: 'public key required' });
            return;
        }

        // basic validation - should be base64 encoded
        if (!/^[A-Za-z0-9+/=]+$/.test(publicKey)) {
            res.status(400).json({ error: 'invalid public key format' });
            return;
        }

        // For now, store as the user's primary public key
        // In production, this would store multiple keys in a separate table
        await prisma.user.update({
            where: { id: userId },
            data: {
                publicKey,
                publicKeyRegisteredAt: new Date(),
            },
        });

        res.json({
            success: true,
            message: 'public key registered',
            label: label || 'default',
        });
    } catch (error: any) {
        console.error('[register key error]', error);
        res.status(500).json({ error: 'failed to register key' });
    }
});

// ==========================================
// register public key for digital signatures
// ==========================================
router.post('/register-public-key', authenticateToken, async (req, res) => {
    try {
        const userId = req.user!.userId;
        const ipAddress = getIp(req);
        const { publicKey } = req.body;

        if (!publicKey || typeof publicKey !== 'string') {
            res.status(400).json({ error: 'public key required' });
            return;
        }

        // basic validation - should be base64 encoded
        if (!/^[A-Za-z0-9+/=]+$/.test(publicKey)) {
            res.status(400).json({ error: 'invalid public key format' });
            return;
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                publicKey,
                publicKeyRegisteredAt: new Date(),
            },
        });

        await logAudit({
            userId,
            userRole: user.role,
            userName: user.name,
            action: 'REGISTER',
            changes: { publicKeyRegistered: true },
            ipAddress,
        });

        res.json({
            success: true,
            message: 'public key registered successfully',
            registeredAt: user.publicKeyRegisteredAt,
        });
    } catch (error: any) {
        console.error('[register public key error]', error);
        res.status(500).json({ error: 'failed to register public key' });
    }
});

export default router;
