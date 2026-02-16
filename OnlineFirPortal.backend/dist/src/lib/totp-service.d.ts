/**
 * totp service for google authenticator integration
 * provides time-based one-time password functionality
 */
export interface TOTPSetup {
    secret: string;
    qrCode: string;
    manualEntryKey: string;
}
/**
 * generate totp secret and qr code for user
 */
export declare function generateTOTPSecret(userEmail: string): Promise<TOTPSetup>;
/**
 * verify totp token
 * allows ±1 window for time drift
 */
export declare function verifyTOTP(token: string, secret: string): boolean;
/**
 * generate recovery codes for mfa backup
 * returns 10 random codes
 */
export declare function generateRecoveryCodes(): string[];
//# sourceMappingURL=totp-service.d.ts.map