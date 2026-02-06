import { randomBytes, createHash } from 'crypto';
import { prisma } from './prisma';

export function validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

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

export function checkPasswordHistory(
    newPasswordHash: string,
    passwordHistory?: string
): boolean {
    if (!passwordHistory) return true;

    try {
        const history: string[] = JSON.parse(passwordHistory);
        return !history.includes(newPasswordHash);
    } catch {
        return true;
    }
}

export function updatePasswordHistory(
    newPasswordHash: string,
    currentHistory?: string
): string {
    let history: string[] = [];

    if (currentHistory) {
        try {
            history = JSON.parse(currentHistory);
        } catch {
            history = [];
        }
    }

    history.unshift(newPasswordHash);
    history = history.slice(0, 5);

    return JSON.stringify(history);
}

export function generateResetToken(): { token: string; tokenHash: string } {
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');

    return { token, tokenHash };
}

export async function createPasswordResetRequest(userId: string): Promise<string> {
    const { token, tokenHash } = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
        data: {
            userId,
            tokenHash,
            expiresAt,
            adminApproved: false,
        },
    });

    return token;
}

export async function verifyResetToken(token: string): Promise<{
    valid: boolean;
    userId?: string;
    requiresApproval?: boolean;
}> {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const resetToken = await prisma.passwordResetToken.findUnique({
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

export async function markResetTokenUsed(token: string): Promise<void> {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    await prisma.passwordResetToken.update({
        where: { tokenHash },
        data: {
            used: true,
            usedAt: new Date(),
        },
    });
}

export async function approvePasswordReset(
    tokenId: string,
    adminId: string
): Promise<void> {
    await prisma.passwordResetToken.update({
        where: { id: tokenId },
        data: {
            adminApproved: true,
            adminApprovedBy: adminId,
            adminApprovedAt: new Date(),
        },
    });
}

export async function getPendingResetRequests() {
    return await prisma.passwordResetToken.findMany({
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
