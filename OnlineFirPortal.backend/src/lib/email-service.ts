/**
 * Email Service for OTP and Notifications
 * Using Resend for production-ready email delivery
 */

import { Resend } from 'resend';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY || 're_demo_key');

// Sender email (must be verified in Resend dashboard)
const FROM_EMAIL = process.env.FROM_EMAIL || 'FIR Portal <onboarding@resend.dev>';
const APP_NAME = 'Online FIR Portal';

/**
 * Send OTP email for MFA verification
 */
export async function sendOTPEmail(
  to: string,
  otp: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // For demo/development, log OTP to console
    if (process.env.NODE_ENV === 'development' || !process.env.RESEND_API_KEY) {
      console.log('[email-service] OTP for', to, ':', otp);
      return { success: true };
    }

    // Send actual email in production
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Your ${APP_NAME} Login Code`,
      html: generateOTPEmailHTML(otp, userName),
      text: generateOTPEmailText(otp, userName),
    });

    if (error) {
      console.error('[EMAIL SERVICE ERROR]', error);
      return { success: false, error: error.message };
    }

    console.log('[EMAIL SERVICE] OTP sent successfully to:', to);
    return { success: true };
  } catch (error: any) {
    console.error('[EMAIL SERVICE ERROR]', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send FIR registration confirmation email
 */
export async function sendFIRConfirmationEmail(
  to: string,
  userName: string,
  firNumber: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.RESEND_API_KEY) {
      console.log('[email-service] FIR confirmation for', to, ':', firNumber);
      return { success: true };
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `FIR Registered Successfully - ${firNumber}`,
      html: generateFIRConfirmationHTML(userName, firNumber),
      text: generateFIRConfirmationText(userName, firNumber),
    });

    if (error) {
      console.error('[EMAIL SERVICE ERROR]', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[EMAIL SERVICE ERROR]', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send FIR status update email
 */
export async function sendFIRStatusUpdateEmail(
  to: string,
  userName: string,
  firNumber: string,
  oldStatus: string,
  newStatus: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.RESEND_API_KEY) {
      console.log('[email-service] FIR status update for', to);
      return { success: true };
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `FIR Status Updated - ${firNumber}`,
      html: generateStatusUpdateHTML(userName, firNumber, oldStatus, newStatus),
      text: generateStatusUpdateText(userName, firNumber, oldStatus, newStatus),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Generate OTP email HTML
 */
function generateOTPEmailHTML(otp: string, userName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Login Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Online FIR Portal</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 20px;">Hello ${userName},</h2>
              <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                Your One-Time Password (OTP) for logging into the Online FIR Portal is:
              </p>
              
              <!-- OTP Box -->
              <div style="background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 24px; text-align: center; margin: 0 0 24px;">
                <div style="font-size: 36px; font-weight: 700; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${otp}
                </div>
              </div>
              
              <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 14px; line-height: 1.5;">
                This code will expire in <strong>10 minutes</strong>.
              </p>
              <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 14px; line-height: 1.5;">
                For security reasons, never share this code with anyone.
              </p>
              
              <!-- Warning Box -->
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 0 0 24px; border-radius: 4px;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>Security Notice:</strong> If you didn't request this code, please ignore this email and secure your account immediately.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 8px; color: #6c757d; font-size: 12px; text-align: center;">
                This is an automated message from Online FIR Portal
              </p>
              <p style="margin: 0; color: #6c757d; font-size: 12px; text-align: center;">
                Government of India | Ministry of Home Affairs
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate OTP email plain text
 */
function generateOTPEmailText(otp: string, userName: string): string {
  return `
Hello ${userName},

Your One-Time Password (OTP) for logging into the Online FIR Portal is:

${otp}

This code will expire in 10 minutes.

For security reasons, never share this code with anyone.

If you didn't request this code, please ignore this email and secure your account immediately.

---
Online FIR Portal
Government of India | Ministry of Home Affairs
  `.trim();
}

/**
 * Generate FIR confirmation email HTML
 */
function generateFIRConfirmationHTML(userName: string, firNumber: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>FIR Registered Successfully</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <tr>
      <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px;">FIR Registered Successfully</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px;">
        <h2 style="margin: 0 0 16px; color: #1a1a1a;">Dear ${userName},</h2>
        <p style="margin: 0 0 24px; color: #4a4a4a; line-height: 1.6;">
          Your First Information Report (FIR) has been successfully registered in our system.
        </p>
        <div style="background-color: #f8f9fa; border-left: 4px solid #28a745; padding: 20px; margin: 0 0 24px;">
          <p style="margin: 0 0 8px; color: #6c757d; font-size: 14px;"><strong>FIR Reference Number:</strong></p>
          <p style="margin: 0; color: #28a745; font-size: 24px; font-weight: 700; font-family: monospace;">${firNumber}</p>
        </div>
        <p style="margin: 0 0 16px; color: #4a4a4a; line-height: 1.6;">
          You can track the status of your FIR using this reference number on our portal.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef;">
        <p style="margin: 0; color: #6c757d; font-size: 12px; text-align: center;">
          Online FIR Portal | Government of India
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate FIR confirmation plain text
 */
function generateFIRConfirmationText(userName: string, firNumber: string): string {
  return `
Dear ${userName},

Your First Information Report (FIR) has been successfully registered in our system.

FIR Reference Number: ${firNumber}

You can track the status of your FIR using this reference number on our portal.

---
Online FIR Portal
Government of India
  `.trim();
}

/**
 * Generate status update email HTML
 */
function generateStatusUpdateHTML(
  userName: string,
  firNumber: string,
  oldStatus: string,
  newStatus: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>FIR Status Updated</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px;">
    <tr>
      <td style="padding: 40px;">
        <h2>Dear ${userName},</h2>
        <p>The status of your FIR <strong>${firNumber}</strong> has been updated:</p>
        <p><strong>Previous Status:</strong> ${oldStatus}</p>
        <p><strong>New Status:</strong> ${newStatus}</p>
        <p>You can view more details on the portal.</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate status update plain text
 */
function generateStatusUpdateText(
  userName: string,
  firNumber: string,
  oldStatus: string,
  newStatus: string
): string {
  return `
Dear ${userName},

The status of your FIR ${firNumber} has been updated:

Previous Status: ${oldStatus}
New Status: ${newStatus}

You can view more details on the portal.

---
Online FIR Portal
  `.trim();
}
