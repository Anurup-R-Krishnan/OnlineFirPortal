/**
 * totp service for google authenticator integration
 * provides time-based one-time password functionality
 */

import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

const APP_NAME = 'Online FIR Portal';

export interface TOTPSetup {
    secret: string;
    qrCode: string;
    manualEntryKey: string;
}

/**
 * generate totp secret and qr code for user
 */
export async function generateTOTPSecret(userEmail: string): Promise<TOTPSetup> {
    const secret = speakeasy.generateSecret({
        name: `${APP_NAME} (${userEmail})`,
        issuer: APP_NAME,
        length: 32,
    });

    if (!secret.otpauth_url) {
        throw new Error('failed to generate totp secret');
    }

    const qrCode = await qrcode.toDataURL(secret.otpauth_url);

    return {
        secret: secret.base32,
        qrCode,
        manualEntryKey: secret.base32,
    };
}

/**
 * verify totp token
 * allows ±1 window for time drift
 */
export function verifyTOTP(token: string, secret: string): boolean {
    return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 1, // allow ±30 seconds time drift
    });
}

/**
 * generate recovery codes for mfa backup
 * returns 10 random codes
 */
export function generateRecoveryCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        codes.push(code);
    }
    return codes;
}
