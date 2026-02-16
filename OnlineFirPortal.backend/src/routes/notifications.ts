import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../lib/auth-middleware';

const router = express.Router();

/**
 * GET /api/notifications
 * Get all notifications for the authenticated user
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user!.userId;

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        res.json(notifications);
    } catch (error) {
        console.error('[get notifications error]', error);
        res.status(500).json({ error: 'failed to fetch notifications' });
    }
});

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for the authenticated user
 */
router.post('/read-all', authenticateToken, async (req, res) => {
    try {
        const userId = req.user!.userId;

        await prisma.notification.updateMany({
            where: { 
                userId,
                read: false
            },
            data: {
                read: true,
                readAt: new Date()
            }
        });

        res.json({ success: true, message: 'all notifications marked as read' });
    } catch (error) {
        console.error('[mark all read error]', error);
        res.status(500).json({ error: 'failed to mark notifications as read' });
    }
});

export default router;
