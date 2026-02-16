"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../lib/prisma");
const auth_middleware_1 = require("../lib/auth-middleware");
const router = express_1.default.Router();
/**
 * GET /api/notifications
 * Get all notifications for the authenticated user
 */
router.get('/', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const notifications = await prisma_1.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(notifications);
    }
    catch (error) {
        console.error('[get notifications error]', error);
        res.status(500).json({ error: 'failed to fetch notifications' });
    }
});
/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for the authenticated user
 */
router.post('/read-all', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        await prisma_1.prisma.notification.updateMany({
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
    }
    catch (error) {
        console.error('[mark all read error]', error);
        res.status(500).json({ error: 'failed to mark notifications as read' });
    }
});
exports.default = router;
//# sourceMappingURL=notifications.js.map