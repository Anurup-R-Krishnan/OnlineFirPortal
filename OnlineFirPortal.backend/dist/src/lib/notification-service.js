"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
exports.notifyFIRStatusUpdate = notifyFIRStatusUpdate;
exports.notifyFIRAssignment = notifyFIRAssignment;
exports.getUserNotifications = getUserNotifications;
exports.markNotificationRead = markNotificationRead;
exports.markAllNotificationsRead = markAllNotificationsRead;
const prisma_1 = require("./prisma");
const client_1 = require("@prisma/client");
// Mock Provider (Default for Dev)
class MockNotificationProvider {
    async sendSMS(to, message) {
        console.log(`[MOCK SMS] To: ${to} | Message: ${message}`);
        return true;
    }
    async sendEmail(to, subject, body) {
        console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject} | Body: ${body}`);
        return true;
    }
}
// Factory to get provider based on ENV
function getProvider() {
    // Check ENV for real providers in future (e.g., TWILIO, AWS_SES)
    return new MockNotificationProvider();
}
const provider = getProvider();
/**
 * create notification and trigger delivery
 */
async function createNotification(userId, type, subject, message) {
    // 1. Store in Database
    await prisma_1.prisma.notification.create({
        data: {
            userId,
            type,
            subject,
            message,
        },
    });
    // 2. Fetch User Contact Details (for delivery)
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, mobile: true }
    });
    if (!user)
        return;
    // 3. Trigger Delivery Provider
    try {
        if (type === client_1.NotificationType.SMS && user.mobile) {
            await provider.sendSMS(user.mobile, message);
        }
        else if (type === client_1.NotificationType.EMAIL && user.email) {
            await provider.sendEmail(user.email, subject, message);
        }
    }
    catch (error) {
        console.error(`[Notification Delivery Failed] User: ${userId} Type: ${type}`, error);
    }
}
/**
 * send fir status update notification
 */
async function notifyFIRStatusUpdate(userId, firReference, newStatus) {
    await createNotification(userId, client_1.NotificationType.SMS, // SMS is critical for Government
    'FIR Status Update', `Your FIR ${firReference} status has been updated to: ${newStatus}. - Online FIR Portal`);
    await createNotification(userId, client_1.NotificationType.EMAIL, 'FIR Status Update', `Your FIR ${firReference} status has been updated to: ${newStatus}. Please login to view details.`);
}
/**
 * send fir assignment notification
 */
async function notifyFIRAssignment(officerId, firReference) {
    await createNotification(officerId, client_1.NotificationType.IN_APP, 'New FIR Assigned', `FIR ${firReference} has been assigned to you.`);
    // Also email officers
    await createNotification(officerId, client_1.NotificationType.EMAIL, 'New FIR Assignment', `You have been assigned a new FIR: ${firReference}. Please review immediately.`);
}
/**
 * get user notifications
 */
async function getUserNotifications(userId, unreadOnly = false) {
    return await prisma_1.prisma.notification.findMany({
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
async function markNotificationRead(notificationId) {
    await prisma_1.prisma.notification.update({
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
async function markAllNotificationsRead(userId) {
    await prisma_1.prisma.notification.updateMany({
        where: { userId, read: false },
        data: {
            read: true,
            readAt: new Date(),
        },
    });
}
//# sourceMappingURL=notification-service.js.map