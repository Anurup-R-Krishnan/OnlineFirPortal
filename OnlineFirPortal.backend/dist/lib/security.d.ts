/**
 * Security Utilities for Online FIR Portal
 * Implements: Encryption (AES-256-GCM), Hashing (SHA-256 + Salt + bcrypt),
 * Digital Signatures (RSA-SHA256), and Encoding (Base64)
 */
export * from './access-control';
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
export declare function generateTOTPSecret(): string;
export declare function generateTOTP(secret: string, timeStep?: number): Promise<string>;
export declare function verifyTOTP(token: string, secret: string, timeWindow?: number): Promise<boolean>;
//# sourceMappingURL=security.d.ts.map