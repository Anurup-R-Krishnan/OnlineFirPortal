"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../lib/prisma");
const security_1 = require("../lib/security");
const security_2 = require("../lib/security");
const password_service_1 = require("../lib/password-service");
const audit_logger_1 = require("../lib/audit-logger");
const auth_middleware_1 = require("../lib/auth-middleware");
const router = express_1.default.Router();
const getIp = (req) => req.ip || req.socket.remoteAddress || 'unknown';
router.post('/users/create-officer', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const adminId = req.user.userId;
        const adminRole = req.user.role;
        const ipAddress = getIp(req);
        const { name, email, mobile, policeStation, badgeNumber, rank } = req.body;
        if (!name || !email || !mobile || !policeStation || !badgeNumber) {
            res.status(400).json({ error: 'missing required fields' });
            return;
        }
        const existingUser = await prisma_1.prisma.user.findFirst({
            where: {
                OR: [
                    { email: email.trim().toLowerCase() },
                    { mobile: mobile.trim() },
                ],
            },
        });
        if (existingUser) {
            res.status(409).json({ error: 'user with this email or mobile already exists' });
            return;
        }
        const tempPassword = (0, security_2.generateSecureToken)(16);
        const { hash, salt } = await (0, security_1.hashPassword)(tempPassword);
        const user = await prisma_1.prisma.user.create({
            data: {
                name: (0, security_2.sanitizeInput)(name),
                email: email.trim().toLowerCase(),
                mobile: mobile.trim(),
                role: 'OFFICER',
                passwordHash: hash,
                passwordSalt: salt,
                policeStation: (0, security_2.sanitizeInput)(policeStation),
                badgeNumber: (0, security_2.sanitizeInput)(badgeNumber),
                rank: rank ? (0, security_2.sanitizeInput)(rank) : null,
                forcePasswordChange: true,
                forceMfaSetup: true,
                accountStatus: 'ACTIVE',
            },
        });
        await (0, audit_logger_1.logAudit)({
            action: 'CREATE_USER',
            userId: adminId,
            userRole: adminRole,
            resourceType: 'USER',
            resourceId: user.id,
            changes: { role: 'OFFICER', policeStation, badgeNumber },
            ipAddress,
        });
        res.status(201).json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                policeStation: user.policeStation,
                badgeNumber: user.badgeNumber,
            },
            tempPassword,
            message: 'officer created, send credentials securely to user',
        });
    }
    catch (error) {
        console.error('[create officer error]', error);
        res.status(500).json({ error: 'failed to create officer' });
    }
});
router.post('/users/create-sho', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const adminId = req.user.userId;
        const adminRole = req.user.role;
        const ipAddress = getIp(req);
        const { name, email, mobile, policeStation, badgeNumber } = req.body;
        if (!name || !email || !mobile || !policeStation || !badgeNumber) {
            res.status(400).json({ error: 'missing required fields' });
            return;
        }
        const existingUser = await prisma_1.prisma.user.findFirst({
            where: {
                OR: [
                    { email: email.trim().toLowerCase() },
                    { mobile: mobile.trim() },
                ],
            },
        });
        if (existingUser) {
            res.status(409).json({ error: 'user with this email or mobile already exists' });
            return;
        }
        const tempPassword = (0, security_2.generateSecureToken)(16);
        const { hash, salt } = await (0, security_1.hashPassword)(tempPassword);
        const user = await prisma_1.prisma.user.create({
            data: {
                name: (0, security_2.sanitizeInput)(name),
                email: email.trim().toLowerCase(),
                mobile: mobile.trim(),
                role: 'SHO',
                passwordHash: hash,
                passwordSalt: salt,
                policeStation: (0, security_2.sanitizeInput)(policeStation),
                badgeNumber: (0, security_2.sanitizeInput)(badgeNumber),
                rank: 'SHO',
                forcePasswordChange: true,
                forceMfaSetup: true,
                accountStatus: 'ACTIVE',
            },
        });
        await (0, audit_logger_1.logAudit)({
            action: 'CREATE_USER',
            userId: adminId,
            userRole: adminRole,
            resourceType: 'USER',
            resourceId: user.id,
            changes: { role: 'SHO', policeStation, badgeNumber },
            ipAddress,
        });
        res.status(201).json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
                policeStation: user.policeStation,
                badgeNumber: user.badgeNumber,
            },
            tempPassword,
            message: 'sho created, send credentials securely to user',
        });
    }
    catch (error) {
        console.error('[create sho error]', error);
        res.status(500).json({ error: 'failed to create sho' });
    }
});
router.post('/users/create-admin', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(['SUPER_ADMIN']), async (req, res) => {
    try {
        const adminId = req.user.userId;
        const adminRole = req.user.role;
        const ipAddress = getIp(req);
        const { name, email, mobile } = req.body;
        if (!name || !email || !mobile) {
            res.status(400).json({ error: 'missing required fields' });
            return;
        }
        const existingUser = await prisma_1.prisma.user.findFirst({
            where: {
                OR: [
                    { email: email.trim().toLowerCase() },
                    { mobile: mobile.trim() },
                ],
            },
        });
        if (existingUser) {
            res.status(409).json({ error: 'user with this email or mobile already exists' });
            return;
        }
        const tempPassword = (0, security_2.generateSecureToken)(16);
        const { hash, salt } = await (0, security_1.hashPassword)(tempPassword);
        const user = await prisma_1.prisma.user.create({
            data: {
                name: (0, security_2.sanitizeInput)(name),
                email: email.trim().toLowerCase(),
                mobile: mobile.trim(),
                role: 'ADMIN',
                passwordHash: hash,
                passwordSalt: salt,
                forcePasswordChange: true,
                forceMfaSetup: true,
                accountStatus: 'ACTIVE',
            },
        });
        await (0, audit_logger_1.logAudit)({
            action: 'CREATE_USER',
            userId: adminId,
            userRole: adminRole,
            resourceType: 'USER',
            resourceId: user.id,
            changes: { role: 'ADMIN' },
            ipAddress,
        });
        res.status(201).json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                role: user.role,
            },
            tempPassword,
            message: 'admin created, send credentials securely to user',
        });
    }
    catch (error) {
        console.error('[create admin error]', error);
        res.status(500).json({ error: 'failed to create admin' });
    }
});
router.get('/users', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(['ADMIN', 'SUPER_ADMIN', 'SHO']), async (req, res) => {
    try {
        const { role, policeStation, status, page = '1', limit = '50' } = req.query;
        const where = {};
        if (role)
            where.role = role;
        if (policeStation)
            where.policeStation = policeStation;
        if (status)
            where.accountStatus = status;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [users, total] = await Promise.all([
            prisma_1.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    mobile: true,
                    role: true,
                    accountStatus: true,
                    policeStation: true,
                    badgeNumber: true,
                    rank: true,
                    mfaEnabled: true,
                    lastLoginAt: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            prisma_1.prisma.user.count({ where }),
        ]);
        res.json({
            users,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit)),
        });
    }
    catch (error) {
        console.error('[list users error]', error);
        res.status(500).json({ error: 'failed to list users' });
    }
});
router.get('/users/:id', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(['ADMIN', 'SUPER_ADMIN', 'SHO']), async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: String(id) },
            select: {
                id: true,
                name: true,
                email: true,
                mobile: true,
                role: true,
                accountStatus: true,
                policeStation: true,
                badgeNumber: true,
                rank: true,
                mfaEnabled: true,
                lastLoginAt: true,
                failedLoginAttempts: true,
                lockedUntil: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            res.status(404).json({ error: 'user not found' });
            return;
        }
        res.json({ user });
    }
    catch (error) {
        console.error('[get user error]', error);
        res.status(500).json({ error: 'failed to get user' });
    }
});
router.post('/users/:id/unlock', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const adminId = req.user.userId;
        const adminRole = req.user.role;
        const ipAddress = getIp(req);
        const { id } = req.params;
        await (0, security_2.unlockAccount)(String(id), adminId);
        await (0, audit_logger_1.logAudit)({
            action: 'ACCOUNT_UNLOCKED',
            userId: adminId,
            userRole: adminRole,
            resourceType: 'USER',
            resourceId: String(id),
            changes: {},
            ipAddress,
        });
        res.json({
            success: true,
            message: 'account unlocked successfully',
        });
    }
    catch (error) {
        console.error('[unlock account error]', error);
        res.status(500).json({ error: 'failed to unlock account' });
    }
});
router.get('/password-reset-requests', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const requests = await (0, password_service_1.getPendingResetRequests)();
        res.json({ requests });
    }
    catch (error) {
        console.error('[get reset requests error]', error);
        res.status(500).json({ error: 'failed to get reset requests' });
    }
});
router.post('/password-reset-requests/:id/approve', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const adminId = req.user.userId;
        const { id } = req.params;
        await (0, password_service_1.approvePasswordReset)(String(id), adminId);
        res.json({
            success: true,
            message: 'password reset approved',
        });
    }
    catch (error) {
        console.error('[approve reset error]', error);
        res.status(500).json({ error: 'failed to approve reset' });
    }
});
router.get('/audit-logs', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const { userId, action, resourceType, resourceId, startDate, endDate, page = '1', limit = '100' } = req.query;
        const filters = {
            userId: userId ? String(userId) : undefined,
            action: action,
            resourceType: resourceType ? String(resourceType) : undefined,
            resourceId: resourceId ? String(resourceId) : undefined,
            startDate: startDate ? new Date(String(startDate)) : undefined,
            endDate: endDate ? new Date(String(endDate)) : undefined,
            limit: parseInt(String(limit)),
            offset: (parseInt(String(page)) - 1) * parseInt(String(limit)),
        };
        const result = await (0, audit_logger_1.queryAuditLogs)(filters);
        res.json({
            logs: result.logs,
            total: result.total,
            page: parseInt(String(page)),
            limit: parseInt(String(limit)),
            pages: Math.ceil(result.total / parseInt(String(limit))),
        });
    }
    catch (error) {
        console.error('[get audit logs error]', error);
        res.status(500).json({ error: 'failed to get audit logs' });
    }
});
// ==========================================
// get all documents
// ==========================================
router.get('/documents', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const { page = '1', limit = '50' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [documents, total] = await Promise.all([
            prisma_1.prisma.document.findMany({
                select: {
                    id: true,
                    filename: true,
                    mimetype: true,
                    size: true,
                    documentType: true,
                    verified: true,
                    createdAt: true,
                    firId: true,
                    uploadedById: true,
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            prisma_1.prisma.document.count(),
        ]);
        res.json({
            documents,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit)),
        });
    }
    catch (error) {
        console.error('[list documents error]', error);
        res.status(500).json({ error: 'failed to list documents' });
    }
});
// ==========================================
// get all firs
// ==========================================
router.get('/firs', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const { status, page = '1', limit = '50' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const where = {};
        if (status)
            where.status = status;
        const [firs, total] = await Promise.all([
            prisma_1.prisma.fIR.findMany({
                where,
                select: {
                    id: true,
                    referenceNumber: true,
                    title: true,
                    status: true,
                    priority: true,
                    createdAt: true,
                    reporterId: true,
                    assignedOfficerId: true,
                    assignedStation: true,
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(limit),
            }),
            prisma_1.prisma.fIR.count({ where }),
        ]);
        res.json({
            firs,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit)),
        });
    }
    catch (error) {
        console.error('[list firs error]', error);
        res.status(500).json({ error: 'failed to list firs' });
    }
});
// ==========================================
// get reports summary
// ==========================================
router.get('/reports/summary', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const [totalUsers, totalFirs, totalDocuments, pendingResets, recentAuditLogs] = await Promise.all([
            prisma_1.prisma.user.count(),
            prisma_1.prisma.fIR.count(),
            prisma_1.prisma.document.count(),
            prisma_1.prisma.passwordResetToken.count({
                where: { used: false, adminApproved: false }
            }),
            prisma_1.prisma.auditLog.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    action: true,
                    userName: true,
                    createdAt: true,
                    success: true,
                }
            })
        ]);
        const firStats = await prisma_1.prisma.fIR.groupBy({
            by: ['status'],
            _count: { id: true }
        });
        const statusCounts = {};
        firStats.forEach(stat => {
            statusCounts[stat.status] = stat._count.id;
        });
        res.json({
            totalUsers,
            totalFirs,
            totalDocuments,
            pendingResets,
            recentAuditLogs,
            firStatusCounts: statusCounts,
        });
    }
    catch (error) {
        console.error('[get reports summary error]', error);
        res.status(500).json({ error: 'failed to get reports summary' });
    }
});
// ==========================================
// get system settings
// ==========================================
router.get('/settings', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const settings = await prisma_1.prisma.systemSetting.findMany();
        const settingsObj = {};
        settings.forEach(s => {
            settingsObj[s.key] = s.value;
        });
        res.json(settingsObj);
    }
    catch (error) {
        console.error('[get settings error]', error);
        res.status(500).json({ error: 'failed to get settings' });
    }
});
// ==========================================
// update system settings
// ==========================================
router.post('/settings', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(['SUPER_ADMIN']), async (req, res) => {
    try {
        const adminId = req.user.userId;
        const updates = req.body;
        if (typeof updates !== 'object') {
            res.status(400).json({ error: 'invalid settings format' });
            return;
        }
        for (const [key, value] of Object.entries(updates)) {
            await prisma_1.prisma.systemSetting.upsert({
                where: { key },
                update: {
                    value: String(value),
                    updatedAt: new Date(),
                    updatedBy: adminId,
                },
                create: {
                    key,
                    value: String(value),
                    updatedAt: new Date(),
                    updatedBy: adminId,
                },
            });
        }
        res.json({ success: true, message: 'settings updated' });
    }
    catch (error) {
        console.error('[update settings error]', error);
        res.status(500).json({ error: 'failed to update settings' });
    }
});
// ==========================================
// export audit logs
// ==========================================
router.get('/audit-logs/export', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const userId = req.user.userId;
        const ipAddress = getIp(req);
        const { action, resourceType, resourceId, startDate, endDate } = req.query;
        const filters = {
            action: action,
            resourceType: resourceType ? String(resourceType) : undefined,
            resourceId: resourceId ? String(resourceId) : undefined,
            startDate: startDate ? new Date(String(startDate)) : undefined,
            endDate: endDate ? new Date(String(endDate)) : undefined,
            limit: 10000,
        };
        const result = await (0, audit_logger_1.queryAuditLogs)(filters);
        await (0, audit_logger_1.logAudit)({
            action: 'VIEW_AUDIT_LOG',
            userId,
            userRole: req.user.role,
            userName: req.user.name,
            changes: { action: 'export', count: result.total },
            ipAddress,
        });
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.json"');
        res.json(result.logs);
    }
    catch (error) {
        console.error('[export audit logs error]', error);
        res.status(500).json({ error: 'failed to export audit logs' });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map