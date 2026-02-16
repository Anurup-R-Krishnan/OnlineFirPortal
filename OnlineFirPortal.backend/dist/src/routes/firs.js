"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../lib/prisma");
const auth_middleware_1 = require("../lib/auth-middleware");
const audit_logger_1 = require("../lib/audit-logger");
const security_1 = require("../lib/security");
const router = express_1.default.Router();
const getIp = (req) => req.ip || req.socket.remoteAddress || 'unknown';
router.post('/', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(['CITIZEN']), async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const ipAddress = getIp(req);
        const { complaintType, incidentDate, incidentTime, incidentDescription, incidentState, incidentDistrict, incidentPlace, nearestLandmark, hasWitness, witnessDetails, suspectDetails, ipcSections, } = req.body;
        if (!complaintType || !incidentDate || !incidentDescription || !incidentState || !incidentDistrict || !incidentPlace) {
            res.status(400).json({ error: 'missing required fields' });
            return;
        }
        const referenceNumber = `FIR${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const firData = {
            incidentDescription: (0, security_1.sanitizeInput)(incidentDescription),
            incidentDate: new Date(incidentDate),
            incidentTime: incidentTime || null,
            incidentState: (0, security_1.sanitizeInput)(incidentState),
            incidentDistrict: (0, security_1.sanitizeInput)(incidentDistrict),
            incidentPlace: (0, security_1.sanitizeInput)(incidentPlace),
            nearestLandmark: nearestLandmark ? (0, security_1.sanitizeInput)(nearestLandmark) : null,
            hasWitness: hasWitness || false,
            witnessDetails: witnessDetails ? (0, security_1.sanitizeInput)(witnessDetails) : null,
            suspectDetails: suspectDetails ? (0, security_1.sanitizeInput)(suspectDetails) : null,
            ipcSections: ipcSections || null,
        };
        const encryptedData = await (0, security_1.encryptData)(JSON.stringify(firData));
        const fir = await prisma_1.prisma.fIR.create({
            data: {
                referenceNumber,
                reporterId: userId,
                title: (0, security_1.sanitizeInput)(complaintType),
                crimeType: (0, security_1.sanitizeInput)(complaintType),
                description: (0, security_1.sanitizeInput)(incidentDescription),
                incidentDate: new Date(incidentDate),
                incidentTime: incidentTime || '',
                incidentPlace: (0, security_1.sanitizeInput)(incidentPlace),
                ipcSections: ipcSections || null,
                encryptedData,
                status: 'DRAFT',
                priority: 'MEDIUM',
            },
        });
        await (0, audit_logger_1.logAudit)({
            action: 'FIR_CREATED',
            userId,
            userRole,
            firId: fir.id,
            changes: { firId: fir.id, referenceNumber },
            ipAddress,
        });
        res.status(201).json({
            success: true,
            id: fir.id,
            referenceNumber: fir.referenceNumber,
            status: fir.status,
            message: 'fir created successfully',
        });
    }
    catch (error) {
        console.error('[create fir error]', error);
        res.status(500).json({ error: 'failed to create fir' });
    }
});
router.post('/:id/submit', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(['CITIZEN']), async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const ipAddress = getIp(req);
        const { id } = req.params;
        const fir = await prisma_1.prisma.fIR.findUnique({
            where: { id: String(id) },
        });
        if (!fir) {
            res.status(404).json({ error: 'fir not found' });
            return;
        }
        if (fir.reporterId !== userId) {
            res.status(403).json({ error: 'not authorized to submit this fir' });
            return;
        }
        const { signature } = req.body;
        // verify digital signature if provided
        if (signature) {
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: userId },
                select: { publicKey: true },
            });
            if (!user?.publicKey) {
                res.status(400).json({ error: 'public key not registered, please register your public key first' });
                return;
            }
            // create signature data from fir details
            const signatureData = JSON.stringify({
                firId: fir.id,
                referenceNumber: fir.referenceNumber,
                reporterId: fir.reporterId,
                createdAt: fir.createdAt,
            });
            const isValid = await (0, security_1.verifySignature)(signatureData, signature, user.publicKey);
            if (!isValid) {
                res.status(400).json({ error: 'invalid signature' });
                return;
            }
        }
        if (fir.status !== 'DRAFT') {
            res.status(400).json({ error: 'fir already submitted' });
            return;
        }
        const updateData = {
            status: 'SUBMITTED',
            submittedAt: new Date(),
        };
        if (signature) {
            updateData.signature = signature;
            updateData.signedAt = new Date();
        }
        const updatedFir = await prisma_1.prisma.fIR.update({
            where: { id: String(id) },
            data: updateData,
        });
        await prisma_1.prisma.timeline.create({
            data: {
                firId: updatedFir.id,
                actorId: userId,
                actorName: req.user.name || req.user.email,
                action: 'FIR submitted by citizen',
            },
        });
        await (0, audit_logger_1.logAudit)({
            action: 'FIR_SUBMITTED',
            userId,
            userRole,
            firId: updatedFir.id,
            changes: { previousStatus: 'DRAFT', newStatus: 'SUBMITTED', signed: !!signature },
            ipAddress,
        });
        res.json({
            success: true,
            id: updatedFir.id,
            status: updatedFir.status,
            message: 'fir submitted successfully',
        });
    }
    catch (error) {
        console.error('[submit fir error]', error);
        res.status(500).json({ error: 'failed to submit fir' });
    }
});
router.get('/', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { status, page = '1', limit = '20' } = req.query;
        const where = {};
        if (userRole === 'CITIZEN') {
            where.reporterId = userId;
        }
        else if (userRole === 'OFFICER' || userRole === 'SHO') {
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: userId },
                select: { policeStation: true },
            });
            if (user?.policeStation) {
                where.assignedStation = user.policeStation;
            }
        }
        if (status) {
            where.status = String(status);
        }
        const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));
        const [firs, total] = await Promise.all([
            prisma_1.prisma.fIR.findMany({
                where,
                select: {
                    id: true,
                    referenceNumber: true,
                    title: true,
                    crimeType: true,
                    status: true,
                    priority: true,
                    createdAt: true,
                    submittedAt: true,
                    assignedStation: true,
                    reporter: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            mobile: true,
                        },
                    },
                    assignedOfficer: {
                        select: {
                            id: true,
                            name: true,
                            badgeNumber: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: parseInt(String(limit)),
            }),
            prisma_1.prisma.fIR.count({ where }),
        ]);
        res.json({
            firs,
            total,
            page: parseInt(String(page)),
            limit: parseInt(String(limit)),
            pages: Math.ceil(total / parseInt(String(limit))),
        });
    }
    catch (error) {
        console.error('[list firs error]', error);
        res.status(500).json({ error: 'failed to list firs' });
    }
});
// ==========================================
// get fir statistics
// ==========================================
router.get('/stats', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const where = {};
        if (userRole === 'CITIZEN') {
            where.reporterId = userId;
        }
        else if (userRole === 'OFFICER' || userRole === 'SHO') {
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: userId },
                select: { policeStation: true },
            });
            if (user?.policeStation) {
                where.assignedStation = user.policeStation;
            }
        }
        const stats = await prisma_1.prisma.fIR.groupBy({
            by: ['status'],
            where,
            _count: {
                id: true,
            },
        });
        const counts = {
            total: 0,
            pending: 0,
            assigned: 0,
            investigation: 0,
            closed: 0,
        };
        stats.forEach((stat) => {
            counts.total += stat._count.id;
            switch (stat.status) {
                case 'SUBMITTED':
                    counts.pending += stat._count.id;
                    break;
                case 'UNDER_INVESTIGATION':
                    counts.investigation += stat._count.id;
                    counts.assigned += stat._count.id;
                    break;
                case 'CLOSED':
                case 'REJECTED':
                    counts.closed += stat._count.id;
                    break;
            }
        });
        res.json(counts);
    }
    catch (error) {
        console.error('[get fir stats error]', error);
        res.status(500).json({ error: 'failed to get fir stats' });
    }
});
router.get('/:id', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { id } = req.params;
        const fir = await prisma_1.prisma.fIR.findUnique({
            where: { id: String(id) },
            include: {
                reporter: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        mobile: true,
                    },
                },
                assignedOfficer: {
                    select: {
                        id: true,
                        name: true,
                        badgeNumber: true,
                        rank: true,
                    },
                },
                documents: true,
                timeline: {
                    include: {
                        actor: {
                            select: {
                                name: true,
                                role: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!fir) {
            res.status(404).json({ error: 'fir not found' });
            return;
        }
        if (userRole === 'CITIZEN' && fir.reporterId !== userId) {
            res.status(403).json({ error: 'not authorized to view this fir' });
            return;
        }
        const decryptedData = JSON.parse(await (0, security_1.decryptData)(fir.encryptedData || '{}'));
        res.json({
            ...fir,
            ...decryptedData,
            encryptedData: undefined,
        });
    }
    catch (error) {
        console.error('[get fir error]', error);
        res.status(500).json({ error: 'failed to get fir' });
    }
});
router.post('/:id/assign', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(['ADMIN', 'SHO']), async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const ipAddress = getIp(req);
        const { id } = req.params;
        const { officerId, station } = req.body;
        if (!officerId || !station) {
            res.status(400).json({ error: 'officer id and station required' });
            return;
        }
        const officer = await prisma_1.prisma.user.findUnique({
            where: { id: officerId },
        });
        if (!officer || (officer.role !== 'OFFICER' && officer.role !== 'SHO')) {
            res.status(400).json({ error: 'invalid officer' });
            return;
        }
        const fir = await prisma_1.prisma.fIR.update({
            where: { id: String(id) },
            data: {
                assignedOfficerId: officerId,
                assignedStation: station,
                status: 'UNDER_INVESTIGATION',
            },
        });
        await prisma_1.prisma.timeline.create({
            data: {
                firId: fir.id,
                actorId: userId,
                actorName: req.user.name || req.user.email,
                action: `assigned to officer ${officer.name} at ${station}`,
            },
        });
        await (0, audit_logger_1.logAudit)({
            action: 'FIR_ASSIGNED',
            userId,
            userRole,
            firId: fir.id,
            changes: { officerId, station },
            ipAddress,
        });
        res.json({
            success: true,
            message: 'fir assigned successfully',
        });
    }
    catch (error) {
        console.error('[assign fir error]', error);
        res.status(500).json({ error: 'failed to assign fir' });
    }
});
router.post('/:id/update-status', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(['OFFICER', 'SHO', 'ADMIN']), async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const ipAddress = getIp(req);
        const { id } = req.params;
        const { status, remarks } = req.body;
        if (!status) {
            res.status(400).json({ error: 'status required' });
            return;
        }
        const validStatuses = ['SUBMITTED', 'UNDER_INVESTIGATION', 'CLOSED', 'REJECTED'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({ error: 'invalid status' });
            return;
        }
        // require remarks for closing or rejecting
        if ((status === 'CLOSED' || status === 'REJECTED') && !remarks) {
            res.status(400).json({ error: 'remarks/reason required for closing or rejecting fir' });
            return;
        }
        const fir = await prisma_1.prisma.fIR.findUnique({
            where: { id: String(id) },
        });
        if (!fir) {
            res.status(404).json({ error: 'fir not found' });
            return;
        }
        const updateData = {
            status: status,
        };
        if (status === 'CLOSED') {
            updateData.closedAt = new Date();
        }
        const updatedFir = await prisma_1.prisma.fIR.update({
            where: { id: String(id) },
            data: updateData,
        });
        await prisma_1.prisma.timeline.create({
            data: {
                firId: updatedFir.id,
                actorId: userId,
                actorName: req.user.name || req.user.email,
                action: `status updated to ${status}`,
                details: remarks || null,
            },
        });
        await (0, audit_logger_1.logAudit)({
            action: 'FIR_STATUS_UPDATED',
            userId,
            userRole,
            firId: updatedFir.id,
            changes: { previousStatus: fir.status, newStatus: status, remarks },
            ipAddress,
        });
        res.json({
            success: true,
            message: 'fir status updated successfully',
        });
    }
    catch (error) {
        console.error('[update fir status error]', error);
        res.status(500).json({ error: 'failed to update fir status' });
    }
});
// ==========================================
// add investigation note
// ==========================================
router.post('/:id/notes', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(['OFFICER', 'SHO', 'ADMIN']), async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const ipAddress = getIp(req);
        const { id } = req.params;
        const { note } = req.body;
        if (!note) {
            res.status(400).json({ error: 'note content required' });
            return;
        }
        const fir = await prisma_1.prisma.fIR.findUnique({
            where: { id: String(id) },
        });
        if (!fir) {
            res.status(404).json({ error: 'fir not found' });
            return;
        }
        // verify access (assigned officer or sho/admin)
        if (userRole === 'OFFICER' && fir.assignedOfficerId !== userId) {
            res.status(403).json({ error: 'not authorized to add notes to this fir' });
            return;
        }
        const timelineEntry = await prisma_1.prisma.timeline.create({
            data: {
                firId: fir.id,
                actorId: userId,
                actorName: req.user.name || req.user.email,
                action: 'INVESTIGATION_NOTE',
                details: (0, security_1.sanitizeInput)(note),
            },
        });
        await (0, audit_logger_1.logAudit)({
            action: 'UPDATE_FIR',
            userId,
            userRole,
            firId: fir.id,
            changes: { action: 'added investigation note', noteId: timelineEntry.id },
            ipAddress,
        });
        res.status(201).json({
            success: true,
            message: 'investigation note added successfully',
            data: timelineEntry,
        });
    }
    catch (error) {
        console.error('[add investigation note error]', error);
        res.status(500).json({ error: 'failed to add investigation note' });
    }
});
exports.default = router;
//# sourceMappingURL=firs.js.map