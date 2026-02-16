import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireRole } from '../lib/auth-middleware';
import { logAudit } from '../lib/audit-logger';
import { UserRole } from '@prisma/client';

const router = express.Router();

const getIp = (req: express.Request): string => req.ip || req.socket.remoteAddress || 'unknown';

// ==========================================
// create evidence
// ==========================================
router.post('/', authenticateToken, requireRole(['OFFICER', 'SHO', 'ADMIN']), async (req, res) => {
    try {
        const userId = req.user!.userId;
        const userRole = req.user!.role as UserRole;
        const ipAddress = getIp(req);

        const {
            firId,
            type,
            description,
            quantity,
            storageLocation
        } = req.body;

        if (!firId || !type || !description || !storageLocation) {
            res.status(400).json({ error: 'missing required fields' });
            return;
        }

        const fir = await prisma.fIR.findUnique({
            where: { id: firId },
        });

        if (!fir) {
            res.status(404).json({ error: 'fir not found' });
            return;
        }

        const evidence = await prisma.$transaction(async (tx) => {
            // create evidence record
            const newEvidence = await tx.evidence.create({
                data: {
                    firId,
                    type,
                    description,
                    quantity,
                    storageLocation,
                    status: 'COLLECTED',
                },
            });

            // create initial chain of custody entry
            await tx.chainOfCustody.create({
                data: {
                    evidenceId: newEvidence.id,
                    handlerId: userId,
                    action: 'COLLECTED',
                    purpose: 'Initial collection',
                    location: storageLocation,
                },
            });

            return newEvidence;
        });

        await logAudit({
            action: 'EVIDENCE_CREATED',
            userId,
            userRole,
            firId,
            resourceType: 'Evidence',
            resourceId: evidence.id,
            changes: { type, description, storageLocation },
            ipAddress,
        });

        res.status(201).json({
            success: true,
            message: 'evidence recorded successfully',
            evidence,
        });
    } catch (error: any) {
        console.error('[create evidence error]', error);
        res.status(500).json({ error: 'failed to record evidence' });
    }
});

// ==========================================
// get evidence for FIR
// ==========================================
router.get('/fir/:firId', authenticateToken, requireRole(['OFFICER', 'SHO', 'ADMIN', 'CITIZEN']), async (req, res) => {
    try {
        const { firId } = req.params;
        const userId = req.user!.userId;
        const userRole = req.user!.role as UserRole;

        // check access
        const fir = await prisma.fIR.findUnique({
            where: { id: firId },
        });

        if (!fir) {
            res.status(404).json({ error: 'fir not found' });
            return;
        }

        if (userRole === 'CITIZEN' && fir.reporterId !== userId) {
            res.status(403).json({ error: 'not authorized to view evidence for this fir' });
            return;
        }

        const evidence = await prisma.evidence.findMany({
            where: { firId },
            include: {
                chainOfCustody: {
                    orderBy: { timestamp: 'desc' },
                    take: 1, // only need current handler
                    include: {
                        handler: {
                            select: { name: true, badgeNumber: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(evidence);
    } catch (error: any) {
        console.error('[get evidence error]', error);
        res.status(500).json({ error: 'failed to get evidence' });
    }
});

// ==========================================
// transfer evidence (chain of custody)
// ==========================================
router.post('/:id/transfer', authenticateToken, requireRole(['OFFICER', 'SHO', 'ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;
        const userRole = req.user!.role as UserRole;
        const ipAddress = getIp(req);

        const {
            receiverId,
            action,
            purpose,
            location,
            newStatus
        } = req.body;

        if (!action) {
            res.status(400).json({ error: 'action details required' });
            return;
        }

        const evidence = await prisma.evidence.findUnique({
            where: { id },
        });

        if (!evidence) {
            res.status(404).json({ error: 'evidence not found' });
            return;
        }

        // if receiver specified, ensure they exist
        if (receiverId) {
            const receiver = await prisma.user.findUnique({
                where: { id: receiverId },
            });
            if (!receiver) {
                res.status(400).json({ error: 'receiver not found' });
                return;
            }
        }

        await prisma.$transaction(async (tx) => {
            // add chain of custody entry
            await tx.chainOfCustody.create({
                data: {
                    evidenceId: id,
                    handlerId: userId,
                    receiverId: receiverId || null,
                    action,
                    purpose,
                    location,
                },
            });

            // update evidence status if needed
            if (newStatus) {
                await tx.evidence.update({
                    where: { id },
                    data: { status: newStatus },
                });
            }

            // if location changed, update storage location
            if (location && (action === 'STORED' || action === 'RETURNED')) {
                await tx.evidence.update({
                    where: { id },
                    data: { storageLocation: location },
                });
            }
        });

        await logAudit({
            action: 'EVIDENCE_TRANSFER',
            userId,
            userRole,
            firId: evidence.firId,
            resourceType: 'Evidence',
            resourceId: id,
            changes: { action, receiverId, newStatus },
            ipAddress,
        });

        res.json({
            success: true,
            message: 'chain of custody updated',
        });
    } catch (error: any) {
        console.error('[evidence transfer error]', error);
        res.status(500).json({ error: 'failed to transfer evidence' });
    }
});

// ==========================================
// get full chain of custody
// ==========================================
router.get('/:id/chain-of-custody', authenticateToken, requireRole(['OFFICER', 'SHO', 'ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;

        const history = await prisma.chainOfCustody.findMany({
            where: { evidenceId: id },
            include: {
                handler: {
                    select: { name: true, badgeNumber: true, rank: true }
                },
                receiver: {
                    select: { name: true, badgeNumber: true, rank: true }
                }
            },
            orderBy: { timestamp: 'desc' },
        });

        res.json(history);
    } catch (error: any) {
        console.error('[get chain of custody error]', error);
        res.status(500).json({ error: 'failed to get chain of custody' });
    }
});

export default router;
