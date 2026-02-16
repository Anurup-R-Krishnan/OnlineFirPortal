export * from './access-control';
export declare function checkRateLimit(ipAddress: string): boolean;
export declare function trackFailedLogin(userId: string, email: string, ipAddress?: string, userAgent?: string): Promise<{
    locked: boolean;
    attemptsRemaining: number;
}>;
export declare function resetFailedLoginAttempts(userId: string): Promise<void>;
export declare function isAccountLocked(userId: string): Promise<boolean>;
export declare function unlockAccount(userId: string, adminId: string): Promise<void>;
export declare function sanitizeInput(input: string): string;
export declare function isValidEmail(email: string): boolean;
export declare function isValidMobile(mobile: string): boolean;
export declare function normalizeMobile(mobile: string): string;
export declare function generateSecureToken(length?: number): string;
export declare function cleanupRateLimits(): void;
export declare function encodeBase64(data: string): string;
export declare function decodeBase64(encoded: string): string;
export declare function generateSalt(length?: number): Promise<string>;
export declare function hashWithSalt(data: string, salt: string): Promise<string>;
export declare function hashPassword(password: string): Promise<{
    hash: string;
    salt: string;
}>;
export declare function verifyPassword(password: string, storedHash: string, salt?: string): Promise<boolean>;
export declare function encryptAES(plaintext: string, password: string): Promise<string>;
export declare function decryptAES(ciphertext: string, password: string): Promise<string>;
export declare function generateRSAKeyPair(): Promise<{
    publicKey: string;
    privateKey: string;
}>;
export declare function encryptRSA(data: string, publicKeyBase64: string): Promise<string>;
export declare function decryptRSA(encryptedBase64: string, privateKeyBase64: string): Promise<string>;
export declare function generateRSASigningKeyPair(): Promise<{
    publicKey: string;
    privateKey: string;
}>;
export declare function signData(data: string, privateKeyBase64: string): Promise<string>;
export declare function verifySignature(data: string, signatureBase64: string, publicKeyBase64: string): Promise<boolean>;
export declare function generateFIRNumber(stateCode?: string): string;
export declare function encryptData(data: string): Promise<string>;
export declare function decryptData(encryptedData: string): Promise<string>;
//# sourceMappingURL=security.d.ts.map