/**
 * Email Service for OTP and Notifications
 * Using Resend for production-ready email delivery
 */
/**
 * Send OTP email for MFA verification
 */
export declare function sendOTPEmail(to: string, otp: string, userName: string): Promise<{
    success: boolean;
    error?: string;
}>;
/**
 * Send FIR registration confirmation email
 */
export declare function sendFIRConfirmationEmail(to: string, userName: string, firNumber: string): Promise<{
    success: boolean;
    error?: string;
}>;
/**
 * Send FIR status update email
 */
export declare function sendFIRStatusUpdateEmail(to: string, userName: string, firNumber: string, oldStatus: string, newStatus: string): Promise<{
    success: boolean;
    error?: string;
}>;
//# sourceMappingURL=email-service.d.ts.map