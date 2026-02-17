import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireRole } from '../lib/auth-middleware';
import { logAudit } from '../lib/audit-logger';
import { encryptData, decryptData, sanitizeInput, generateFIRNumber, verifySignature } from '../lib/security';
import { UserRole, FIRStatus, NotificationType } from '@prisma/client';

const router = express.Router();

const getIp = (req: express.Request): string => req.ip || req.socket.remoteAddress || 'unknown';

router.post('/', authenticateToken, requireRole(['CITIZEN']), async (req, res) => {
    try {
        const userId = req.user!.userId;
        const userRole = req.user!.role as UserRole;
        const ipAddress = getIp(req);

        const {
            complaintType,
            incidentDate,
            incidentTime,
            incidentDescription,
            incidentState,
            incidentDistrict,
            incidentPlace,
            nearestLandmark,
            hasWitness,
            witnessDetails,
            suspectDetails,
            ipcSections,
            signature,
            signaturePublicKey,
            signatureData,
            signatureAlgo,
        } = req.body;

        if (!complaintType || !incidentDate || !incidentDescription || !incidentState || !incidentDistrict || !incidentPlace) {
            res.status(400).json({ error: 'missing required fields' });
            return;
        }

        // handle inline signature verification during FIR creation
        let signatureVerified = false;
        if (signature) {
            // auto-register public key if provided inline and not yet stored
            if (signaturePublicKey) {
                const existingUser = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { publicKey: true },
                });
                if (!existingUser?.publicKey) {
                    await prisma.user.update({
                        where: { id: userId },
                        data: { publicKey: signaturePublicKey, publicKeyRegisteredAt: new Date() },
                    });
                }
            }

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { publicKey: true },
            });

            if (!user?.publicKey) {
                res.status(400).json({ error: 'public key not registered, please register your public key first' });
                return;
            }

            // reconstruct the same data the frontend signed
            const expectedSignatureData = JSON.stringify({
                reporterId: userId,
                complaintType,
                incidentDate,
                incidentPlace,
                description: incidentDescription,
            });

            // verify against the reconstructed data (preferred) or the frontend-provided signatureData
            const dataToVerify = expectedSignatureData;
            const isValid = await verifySignature(dataToVerify, signature, user.publicKey);
            if (!isValid) {
                // fallback: try the signatureData string sent by frontend in case of minor field differences
                const fallbackValid = signatureData ? await verifySignature(signatureData, signature, user.publicKey) : false;
                if (!fallbackValid) {
                    res.status(400).json({ error: 'invalid digital signature' });
                    return;
                }
            }
            signatureVerified = true;
        }

        const referenceNumber = `FIR${Date.now()}${Math.floor(Math.random() * 1000)}`;

        const firData = {
            incidentDescription: sanitizeInput(incidentDescription),
            incidentDate: new Date(incidentDate),
            incidentTime: incidentTime || null,
            incidentState: sanitizeInput(incidentState),
            incidentDistrict: sanitizeInput(incidentDistrict),
            incidentPlace: sanitizeInput(incidentPlace),
            nearestLandmark: nearestLandmark ? sanitizeInput(nearestLandmark) : null,
            hasWitness: hasWitness || false,
            witnessDetails: witnessDetails ? sanitizeInput(witnessDetails) : null,
            suspectDetails: suspectDetails ? sanitizeInput(suspectDetails) : null,
            ipcSections: ipcSections || null,
        };

        const encryptedData = await encryptData(JSON.stringify(firData));

        const fir = await prisma.fIR.create({
            data: {
                referenceNumber,
                reporterId: userId,
                title: sanitizeInput(complaintType),
                crimeType: sanitizeInput(complaintType),
                description: sanitizeInput(incidentDescription),
                incidentDate: new Date(incidentDate),
                incidentTime: incidentTime || '',
                incidentPlace: sanitizeInput(incidentPlace),
                incidentState: sanitizeInput(incidentState),
                incidentDistrict: sanitizeInput(incidentDistrict),
                ipcSections: ipcSections || null,
                encryptedData,
                status: signatureVerified ? 'SUBMITTED' : 'DRAFT',
                priority: 'MEDIUM',
                ...(signatureVerified && {
                    signature,
                    signedAt: new Date(),
                    submittedAt: new Date(),
                }),
            },
        });

        if (signatureVerified) {
            await prisma.timeline.create({
                data: {
                    firId: fir.id,
                    actorId: userId,
                    actorName: req.user!.name || req.user!.email,
                    action: 'FIR created and submitted with digital signature',
                },
            });
        }

        await logAudit({
            action: signatureVerified ? 'FIR_SUBMITTED' : 'FIR_CREATED',
            userId,
            userRole,
            firId: fir.id,
            changes: { firId: fir.id, referenceNumber, signed: signatureVerified },
            ipAddress,
        });

        res.status(201).json({
            ...fir,
            reporter: {
                id: userId,
                name: req.user!.name || req.user!.email,
                role: userRole,
            },
            success: true,
            signed: signatureVerified,
            message: signatureVerified ? 'fir created and submitted with digital signature' : 'fir created successfully',
        });
    } catch (error: any) {
        console.error('[create fir error]', error);
        res.status(500).json({ error: 'failed to create fir' });
    }
});

router.post('/:id/submit', authenticateToken, requireRole(['CITIZEN']), async (req, res) => {
    try {
        const userId = req.user!.userId;
        const userRole = req.user!.role as UserRole;
        const ipAddress = getIp(req);
        const { id } = req.params;

        const fir = await prisma.fIR.findUnique({
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

        const { signature, signatureData: clientSignatureData } = req.body;

        // verify digital signature if provided
        if (signature) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { publicKey: true },
            });

            if (!user?.publicKey) {
                res.status(400).json({ error: 'public key not registered, please register your public key first' });
                return;
            }

            // reconstruct signature data from fir details (matching frontend signaturePayload)
            const signatureData = JSON.stringify({
                reporterId: fir.reporterId,
                complaintType: fir.crimeType,
                incidentDate: fir.incidentDate.toISOString(),
                incidentPlace: fir.incidentPlace,
                description: fir.description,
            });

            let isValid = await verifySignature(signatureData, signature, user.publicKey);

            // fallback: try the old format or the signatureData string provided by the client
            if (!isValid) {
                const legacyData = JSON.stringify({
                    firId: fir.id,
                    referenceNumber: fir.referenceNumber,
                    reporterId: fir.reporterId,
                    createdAt: fir.createdAt,
                });
                isValid = await verifySignature(legacyData, signature, user.publicKey);
            }
            if (!isValid && clientSignatureData) {
                isValid = await verifySignature(clientSignatureData, signature, user.publicKey);
            }

            if (!isValid) {
                res.status(400).json({ error: 'invalid signature' });
                return;
            }
        }

        if (fir.status !== 'DRAFT') {
            res.status(400).json({ error: 'fir already submitted' });
            return;
        }

        const updateData: any = {
            status: 'SUBMITTED',
            submittedAt: new Date(),
        };
        if (signature) {
            updateData.signature = signature;
            updateData.signedAt = new Date();
        }

        const updatedFir = await prisma.fIR.update({
            where: { id: String(id) },
            data: updateData,
        });

        await prisma.timeline.create({
            data: {
                firId: updatedFir.id,
                actorId: userId,
                actorName: req.user!.name || req.user!.email,
                action: 'FIR submitted by citizen',
            },
        });

        await logAudit({
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
    } catch (error: any) {
        console.error('[submit fir error]', error);
        res.status(500).json({ error: 'failed to submit fir' });
    }
});

router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user!.userId;
        const userRole = req.user!.role as UserRole;
        const { status, page = '1', limit = '20' } = req.query;

        const where: any = {};

        if (userRole === 'CITIZEN') {
            where.reporterId = userId;
        } else if (userRole === 'OFFICER') {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { policeStation: true },
            });
            if (user?.policeStation) {
                where.assignedStation = user.policeStation;
            }
        } else if (userRole === 'SHO') {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { policeStation: true },
            });

            // SHO must see newly submitted (unassigned) FIRs to perform assignment,
            // plus FIRs already mapped to their station.
            where.OR = [
                { status: 'SUBMITTED' },
                ...(user?.policeStation ? [{ assignedStation: user.policeStation }] : []),
            ];
        }

        if (status) {
            where.status = String(status);
        }

        const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));

        const [firs, total] = await Promise.all([
            prisma.fIR.findMany({
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
            prisma.fIR.count({ where }),
        ]);

        res.json({
            firs,
            total,
            page: parseInt(String(page)),
            limit: parseInt(String(limit)),
            pages: Math.ceil(total / parseInt(String(limit))),
        });
    } catch (error: any) {
        console.error('[list firs error]', error);
        res.status(500).json({ error: 'failed to list firs' });
    }
});

// ==========================================
// get fir statistics
// ==========================================
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user!.userId;
        const userRole = req.user!.role as UserRole;

        const where: any = {};

        if (userRole === 'CITIZEN') {
            where.reporterId = userId;
        } else if (userRole === 'OFFICER') {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { policeStation: true },
            });
            if (user?.policeStation) {
                where.assignedStation = user.policeStation;
            }
        } else if (userRole === 'SHO') {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { policeStation: true },
            });

            where.OR = [
                { status: 'SUBMITTED' },
                ...(user?.policeStation ? [{ assignedStation: user.policeStation }] : []),
            ];
        }

        const stats = await prisma.fIR.groupBy({
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

        stats.forEach((stat: any) => {
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
    } catch (error: any) {
        console.error('[get fir stats error]', error);
        res.status(500).json({ error: 'failed to get fir stats' });
    }
});

// ==========================================
// list assignable officers for FIR assignment
// ==========================================
router.get('/officers', authenticateToken, requireRole(['SHO', 'ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const userId = req.user!.userId;
        const userRole = req.user!.role as UserRole;

        let where: any = {
            role: { in: ['OFFICER', 'SHO'] },
            accountStatus: 'ACTIVE',
        };

        // SHO can assign only within their own station by default.
        if (userRole === 'SHO') {
            const sho = await prisma.user.findUnique({
                where: { id: userId },
                select: { policeStation: true },
            });

            if (sho?.policeStation) {
                where.policeStation = sho.policeStation;
            }
        }

        const officers = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                role: true,
                policeStation: true,
                badgeNumber: true,
                rank: true,
                email: true,
                mobile: true,
            },
            orderBy: [
                { policeStation: 'asc' },
                { role: 'asc' },
                { name: 'asc' },
            ],
        });

        res.json({ officers });
    } catch (error: any) {
        console.error('[list officers error]', error);
        res.status(500).json({ error: 'failed to list officers' });
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user!.userId;
        const userRole = req.user!.role as UserRole;
        const { id } = req.params;

        const fir = await prisma.fIR.findUnique({
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

        let decryptedData: Record<string, any> = {};
        if (fir.encryptedData) {
            try {
                const decrypted = await decryptData(fir.encryptedData);
                decryptedData = JSON.parse(decrypted);
            } catch (decryptError) {
                // Keep the FIR readable even if legacy/corrupted encrypted payload cannot be decrypted.
                console.warn('[get fir decrypt warning]', {
                    firId: fir.id,
                    error: decryptError instanceof Error ? decryptError.message : String(decryptError),
                });
            }
        }

        res.json({
            ...fir,
            ...decryptedData,
            encryptedData: undefined,
        });
    } catch (error: any) {
        console.error('[get fir error]', error);
        res.status(500).json({ error: 'failed to get fir' });
    }
});

router.post('/:id/assign', authenticateToken, requireRole(['ADMIN', 'SHO']), async (req, res) => {
    try {
        const userId = req.user!.userId;
        const userRole = req.user!.role as UserRole;
        const ipAddress = getIp(req);
        const { id } = req.params;
        const { officerId, station } = req.body;

        if (!officerId || !station) {
            res.status(400).json({ error: 'officer id and station required' });
            return;
        }

        const officer = await prisma.user.findUnique({
            where: { id: officerId },
        });

        if (!officer || (officer.role !== 'OFFICER' && officer.role !== 'SHO')) {
            res.status(400).json({ error: 'invalid officer' });
            return;
        }

        const fir = await prisma.fIR.update({
            where: { id: String(id) },
            data: {
                assignedOfficerId: officerId,
                assignedStation: station,
                status: 'UNDER_INVESTIGATION',
            },
        });

        await prisma.timeline.create({
            data: {
                firId: fir.id,
                actorId: userId,
                actorName: req.user!.name || req.user!.email,
                action: `assigned to officer ${officer.name} at ${station}`,
            },
        });

        await logAudit({
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
    } catch (error: any) {
        console.error('[assign fir error]', error);
        res.status(500).json({ error: 'failed to assign fir' });
    }
});

router.post('/:id/update-status', authenticateToken, requireRole(['OFFICER', 'SHO', 'ADMIN']), async (req, res) => {
    try {
        const userId = req.user!.userId;
        const userRole = req.user!.role as UserRole;
        const ipAddress = getIp(req);
        const { id } = req.params;
        const { status, remarks } = req.body;

        if (!status) {
            res.status(400).json({ error: 'status required' });
            return;
        }

        const validStatuses: FIRStatus[] = ['SUBMITTED', 'UNDER_INVESTIGATION', 'CLOSED', 'REJECTED'];
        if (!validStatuses.includes(status as FIRStatus)) {
            res.status(400).json({ error: 'invalid status' });
            return;
        }

        // require remarks for closing or rejecting
        if ((status === 'CLOSED' || status === 'REJECTED') && !remarks) {
            res.status(400).json({ error: 'remarks/reason required for closing or rejecting fir' });
            return;
        }

        const fir = await prisma.fIR.findUnique({
            where: { id: String(id) },
        });

        if (!fir) {
            res.status(404).json({ error: 'fir not found' });
            return;
        }

        const updateData: any = {
            status: status as FIRStatus,
        };
        if (status === 'CLOSED') {
            updateData.closedAt = new Date();
        }

        const updatedFir = await prisma.fIR.update({
            where: { id: String(id) },
            data: updateData,
        });

        await prisma.timeline.create({
            data: {
                firId: updatedFir.id,
                actorId: userId,
                actorName: req.user!.name || req.user!.email,
                action: `status updated to ${status}`,
                details: remarks || null,
            },
        });

        await logAudit({
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
    } catch (error: any) {
        console.error('[update fir status error]', error);
        res.status(500).json({ error: 'failed to update fir status' });
    }
});

// ==========================================
// add investigation note
// ==========================================
router.post('/:id/notes', authenticateToken, requireRole(['OFFICER', 'SHO', 'ADMIN']), async (req, res) => {
    try {
        const userId = req.user!.userId;
        const userRole = req.user!.role as UserRole;
        const ipAddress = getIp(req);
        const { id } = req.params;
        const { note } = req.body;

        if (!note) {
            res.status(400).json({ error: 'note content required' });
            return;
        }

        const fir = await prisma.fIR.findUnique({
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

        const timelineEntry = await prisma.timeline.create({
            data: {
                firId: fir.id,
                actorId: userId,
                actorName: req.user!.name || req.user!.email,
                action: 'INVESTIGATION_NOTE',
                details: sanitizeInput(note),
            },
        });

        await logAudit({
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
    } catch (error: any) {
        console.error('[add investigation note error]', error);
        res.status(500).json({ error: 'failed to add investigation note' });
    }
});

export default router;
