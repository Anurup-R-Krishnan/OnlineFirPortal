export declare function validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
};
export declare function checkPasswordHistory(newPasswordHash: string, passwordHistory?: string): boolean;
export declare function updatePasswordHistory(newPasswordHash: string, currentHistory?: string): string;
export declare function generateResetToken(): {
    token: string;
    tokenHash: string;
};
export declare function createPasswordResetRequest(userId: string): Promise<string>;
export declare function verifyResetToken(token: string): Promise<{
    valid: boolean;
    userId?: string;
    requiresApproval?: boolean;
}>;
export declare function markResetTokenUsed(token: string): Promise<void>;
export declare function approvePasswordReset(tokenId: string, adminId: string): Promise<void>;
export declare function getPendingResetRequests(): Promise<({
    user: {
        name: string;
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
    };
} & {
    id: string;
    createdAt: Date;
    userId: string;
    expiresAt: Date;
    tokenHash: string;
    used: boolean;
    usedAt: Date | null;
    adminApproved: boolean;
    adminApprovedBy: string | null;
    adminApprovedAt: Date | null;
})[]>;
//# sourceMappingURL=password-service.d.ts.map