import { NotificationType } from '@prisma/client';
/**
 * create notification and trigger delivery
 */
export declare function createNotification(userId: string, type: NotificationType, subject: string, message: string): Promise<void>;
/**
 * send fir status update notification
 */
export declare function notifyFIRStatusUpdate(userId: string, firReference: string, newStatus: string): Promise<void>;
/**
 * send fir assignment notification
 */
export declare function notifyFIRAssignment(officerId: string, firReference: string): Promise<void>;
/**
 * get user notifications
 */
export declare function getUserNotifications(userId: string, unreadOnly?: boolean): Promise<{
    error: string | null;
    id: string;
    createdAt: Date;
    userId: string;
    type: import(".prisma/client").$Enums.NotificationType;
    subject: string;
    message: string;
    sent: boolean;
    sentAt: Date | null;
    read: boolean;
    readAt: Date | null;
}[]>;
/**
 * mark notification as read
 */
export declare function markNotificationRead(notificationId: string): Promise<void>;
/**
 * mark all notifications as read
 */
export declare function markAllNotificationsRead(userId: string): Promise<void>;
//# sourceMappingURL=notification-service.d.ts.map