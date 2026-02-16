import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireRole } from '../lib/auth-middleware';
import { logAudit } from '../lib/audit-logger';
import { UserRole } from '@prisma/client';

const router = express.Router();

const getIp = (req: express.Request): string => req.ip || req.socket.remoteAddress || 'unknown';

// ==========================================
// search criminals
// ==========================================
router.get('/', authenticateToken, requireRole(['OFFICER', 'SHO', 'ADMIN']), async (req, res) => {
    try {
        const { query } = req.query;

        let where: any = {};

        if (query) {
            const search = String(query).toLowerCase();
            where = {
                OR: [
                    { name: { contains: search } }, // sqlite case insensitive by default for ASCII, but good practice
                    { aliases: { contains: search } },
                    { mobile: { contains: search } },
                ]
            };
        }

        const criminals = await prisma.criminal.findMany({
            where,
            include: {
                firs: {
                    select: {
                        involvementType: true,
                        status: true,
                        fir: {
                            select: { referenceNumber: true, crimeType: true }
                        }
                    }
                }
            },
            orderBy: { updatedAt: 'desc' },
            take: 50
        });

        res.json(criminals);
    } catch (error: any) {
        console.error('[search criminals error]', error);
        res.status(500).json({ error: 'failed to search criminals' });
    }
});

// ==========================================
// create criminal profile
// ==========================================
router.post('/', authenticateToken, requireRole(['OFFICER', 'SHO', 'ADMIN']), async (req, res) => {
    try {
        const userId = req.user!.userId;
        const userRole = req.user!.role as UserRole;
        const ipAddress = getIp(req);

        const {
            name, aliases, dateOfBirth, gender, nationality,
            height, weight, complexion, eyeColor, hairColor, identifyingMarks,
            address, mobile, status, mugshotUrl
        } = req.body;

        if (!name) {
            res.status(400).json({ error: 'name required' });
            return;
        }

        const criminal = await prisma.criminal.create({
            data: {
                name, aliases,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                gender, nationality,
                height, weight, complexion, eyeColor, hairColor, identifyingMarks,
                address, mobile,
                status: status || 'ACTIVE',
                mugshotUrl
            }
        });

        await logAudit({
            action: 'CRIMINAL_CREATED',
            userId,
            userRole,
            resourceType: 'Criminal',
            resourceId: criminal.id,
            changes: { name, status },
            ipAddress,
        });

        res.status(201).json({
            success: true,
            message: 'criminal profile created',
            criminal
        });
    } catch (error: any) {
        console.error('[create criminal error]', error);
        res.status(500).json({ error: 'failed to create criminal profile' });
    }
});

// ==========================================
// link criminal to FIR
// ==========================================
router.post('/:id/link-fir', authenticateToken, requireRole(['OFFICER', 'SHO', 'ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;
        const userRole = req.user!.role as UserRole;
        const ipAddress = getIp(req);

        const { firId, involvementType, description, status } = req.body;

        if (!firId || !involvementType) {
            res.status(400).json({ error: 'firId and involvementType required' });
            return;
        }

        const fir = await prisma.fIR.findUnique({
            where: { id: firId }
        });

        if (!fir) {
            res.status(404).json({ error: 'fir not found' });
            return;
        }

        // check if already linked
        const existingLink = await prisma.criminalFir.findUnique({
            where: {
                criminalId_firId: {
                    criminalId: id,
                    firId
                }
            }
        });

        if (existingLink) {
            res.status(400).json({ error: 'criminal already linked to this fir' });
            return;
        }

        await prisma.criminalFir.create({
            data: {
                criminalId: id,
                firId,
                involvementType,
                description,
                status
            }
        });

        // Add timeline entry to FIR
        await prisma.timeline.create({
            data: {
                firId,
                actorId: userId,
                actorName: req.user!.name || req.user!.email,
                action: 'SUSPECT_LINKED',
                details: `Linked suspect/criminal (ID: ${id}) as ${involvementType}`
            }
        });

        await logAudit({
            action: 'CRIMINAL_LINKED',
            userId,
            userRole,
            firId,
            resourceType: 'Criminal',
            resourceId: id,
            changes: { firId, involvementType },
            ipAddress,
        });

        res.json({
            success: true,
            message: 'criminal linked to fir successfully'
        });
    } catch (error: any) {
        console.error('[link criminal error]', error);
        res.status(500).json({ error: 'failed to link criminal' });
    }
});

export default router;
