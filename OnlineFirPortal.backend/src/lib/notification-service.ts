import { prisma } from './prisma';
import { NotificationType } from '@prisma/client';

// Provider Interface
interface NotificationProvider {
    sendSMS(to: string, message: string): Promise<boolean>;
    sendEmail(to: string, subject: string, body: string): Promise<boolean>;
}

// Mock Provider (Default for Dev)
class MockNotificationProvider implements NotificationProvider {
    async sendSMS(to: string, message: string): Promise<boolean> {
        console.log(`[MOCK SMS] To: ${to} | Message: ${message}`);
        return true;
    }

    async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
        console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject} | Body: ${body}`);
        return true;
    }
}

// Factory to get provider based on ENV
function getProvider(): NotificationProvider {
    // Check ENV for real providers in future (e.g., TWILIO, AWS_SES)
    return new MockNotificationProvider();
}

const provider = getProvider();

/**
 * create notification and trigger delivery
 */
export async function createNotification(
    userId: string,
    type: NotificationType,
    subject: string,
    message: string
): Promise<void> {
    // 1. Store in Database
    await prisma.notification.create({
        data: {
            userId,
            type,
            subject,
            message,
        },
    });

    // 2. Fetch User Contact Details (for delivery)
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, mobile: true }
    });

    if (!user) return;

    // 3. Trigger Delivery Provider
    try {
        if (type === NotificationType.SMS && user.mobile) {
            await provider.sendSMS(user.mobile, message);
        } else if (type === NotificationType.EMAIL && user.email) {
            await provider.sendEmail(user.email, subject, message);
        }
    } catch (error) {
        console.error(`[Notification Delivery Failed] User: ${userId} Type: ${type}`, error);
    }
}

/**
 * send fir status update notification
 */
export async function notifyFIRStatusUpdate(
    userId: string,
    firReference: string,
    newStatus: string
): Promise<void> {
    await createNotification(
        userId,
        NotificationType.SMS, // SMS is critical for Government
        'FIR Status Update',
        `Your FIR ${firReference} status has been updated to: ${newStatus}. - Online FIR Portal`
    );
    await createNotification(
        userId,
        NotificationType.EMAIL,
        'FIR Status Update',
        `Your FIR ${firReference} status has been updated to: ${newStatus}. Please login to view details.`
    );
}

/**
 * send fir assignment notification
 */
export async function notifyFIRAssignment(
    officerId: string,
    firReference: string
): Promise<void> {
    await createNotification(
        officerId,
        NotificationType.IN_APP,
        'New FIR Assigned',
        `FIR ${firReference} has been assigned to you.`
    );
    // Also email officers
    await createNotification(
        officerId,
        NotificationType.EMAIL,
        'New FIR Assignment',
        `You have been assigned a new FIR: ${firReference}. Please review immediately.`
    );
}

/**
 * get user notifications
 */
export async function getUserNotifications(userId: string, unreadOnly = false) {
    return await prisma.notification.findMany({
        where: {
            userId,
            ...(unreadOnly ? { read: false } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });
}

/**
 * mark notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
    await prisma.notification.update({
        where: { id: notificationId },
        data: {
            read: true,
            readAt: new Date(),
        },
    });
}

/**
 * mark all notifications as read
 */
export async function markAllNotificationsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
        where: { userId, read: false },
        data: {
            read: true,
            readAt: new Date(),
        },
    });
}
