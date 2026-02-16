"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePasswordStrength = validatePasswordStrength;
exports.checkPasswordHistory = checkPasswordHistory;
exports.updatePasswordHistory = updatePasswordHistory;
exports.generateResetToken = generateResetToken;
exports.createPasswordResetRequest = createPasswordResetRequest;
exports.verifyResetToken = verifyResetToken;
exports.markResetTokenUsed = markResetTokenUsed;
exports.approvePasswordReset = approvePasswordReset;
exports.getPendingResetRequests = getPendingResetRequests;
const crypto_1 = require("crypto");
const prisma_1 = require("./prisma");
function validatePasswordStrength(password) {
    const errors = [];
    if (password.length < 12) {
        errors.push('password must be at least 12 characters long');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('password must contain at least one special character');
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
function checkPasswordHistory(newPasswordHash, passwordHistory) {
    if (!passwordHistory)
        return true;
    try {
        const history = JSON.parse(passwordHistory);
        return !history.includes(newPasswordHash);
    }
    catch {
        return true;
    }
}
function updatePasswordHistory(newPasswordHash, currentHistory) {
    let history = [];
    if (currentHistory) {
        try {
            history = JSON.parse(currentHistory);
        }
        catch {
            history = [];
        }
    }
    history.unshift(newPasswordHash);
    history = history.slice(0, 5);
    return JSON.stringify(history);
}
function generateResetToken() {
    const token = (0, crypto_1.randomBytes)(32).toString('hex');
    const tokenHash = (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    return { token, tokenHash };
}
async function createPasswordResetRequest(userId) {
    const { token, tokenHash } = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma_1.prisma.passwordResetToken.create({
        data: {
            userId,
            tokenHash,
            expiresAt,
            adminApproved: false,
        },
    });
    return token;
}
async function verifyResetToken(token) {
    const tokenHash = (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    const resetToken = await prisma_1.prisma.passwordResetToken.findUnique({
        where: { tokenHash },
        include: { user: true },
    });
    if (!resetToken) {
        return { valid: false };
    }
    if (resetToken.used) {
        return { valid: false };
    }
    if (resetToken.expiresAt < new Date()) {
        return { valid: false };
    }
    if (resetToken.user.role === 'CITIZEN' && !resetToken.adminApproved) {
        return {
            valid: false,
            requiresApproval: true,
        };
    }
    return {
        valid: true,
        userId: resetToken.userId,
    };
}
async function markResetTokenUsed(token) {
    const tokenHash = (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    await prisma_1.prisma.passwordResetToken.update({
        where: { tokenHash },
        data: {
            used: true,
            usedAt: new Date(),
        },
    });
}
async function approvePasswordReset(tokenId, adminId) {
    await prisma_1.prisma.passwordResetToken.update({
        where: { id: tokenId },
        data: {
            adminApproved: true,
            adminApprovedBy: adminId,
            adminApprovedAt: new Date(),
        },
    });
}
async function getPendingResetRequests() {
    return await prisma_1.prisma.passwordResetToken.findMany({
        where: {
            used: false,
            adminApproved: false,
            expiresAt: { gte: new Date() },
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
}
//# sourceMappingURL=password-service.js.map