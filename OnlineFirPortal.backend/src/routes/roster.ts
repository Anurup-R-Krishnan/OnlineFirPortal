import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireRole } from '../lib/auth-middleware';
import { logAudit } from '../lib/audit-logger';
import { UserRole, DutyStatus, ShiftType } from '@prisma/client';

const router = express.Router();

const getIp = (req: express.Request): string => req.ip || req.socket.remoteAddress || 'unknown';

// ==========================================
// get current roster
// ==========================================
router.get('/', authenticateToken, requireRole(['OFFICER', 'SHO', 'ADMIN']), async (req, res) => {
    try {
        const { date, station } = req.query;

        let where: any = {};

        // filter by date (default to today)
        const queryDate = date ? new Date(String(date)) : new Date();
        const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

        where.startTime = {
            gte: startOfDay,
            lte: endOfDay
        };

        // filter by station if provided, otherwise show all or filter by user's station
        if (station) {
            where.officer = { policeStation: String(station) };
        }

        const roster = await prisma.dutyShift.findMany({
            where,
            include: {
                officer: {
                    select: {
                        id: true,
                        name: true,
                        badgeNumber: true,
                        rank: true,
                        policeStation: true,
                        mobile: true
                    }
                }
            },
            orderBy: { startTime: 'asc' }
        });

        res.json(roster);
    } catch (error: any) {
        console.error('[get roster error]', error);
        res.status(500).json({ error: 'failed to get roster' });
    }
});

// ==========================================
// assign/update shift
// ==========================================
router.post('/shift', authenticateToken, requireRole(['SHO', 'ADMIN']), async (req, res) => {
    try {
        const userId = req.user!.userId;
        const userRole = req.user!.role as UserRole;
        const ipAddress = getIp(req);

        const {
            officerId,
            startTime,
            endTime,
            type,
            status,
            activities,
            location
        } = req.body;

        if (!officerId || !startTime || !type) {
            res.status(400).json({ error: 'officer, start time, and shift type required' });
            return;
        }

        const shift = await prisma.dutyShift.create({
            data: {
                officerId,
                startTime: new Date(startTime),
                endTime: endTime ? new Date(endTime) : null,
                type: type as ShiftType,
                status: status as DutyStatus || 'ON_DUTY',
                activities,
                location
            }
        });

        await logAudit({
            action: 'ROSTER_UPDATE',
            userId,
            userRole,
            resourceType: 'DutyShift',
            resourceId: shift.id,
            changes: { officerId, type, status },
            ipAddress,
        });

        res.status(201).json({
            success: true,
            message: 'shift assigned successfully',
            shift
        });
    } catch (error: any) {
        console.error('[assign shift error]', error);
        res.status(500).json({ error: 'failed to assign shift' });
    }
});

// ==========================================
// update my status (for officers)
// ==========================================
router.post('/status', authenticateToken, requireRole(['OFFICER', 'SHO']), async (req, res) => {
    try {
        const userId = req.user!.userId;
        const { status, location, activities } = req.body;

        // find active shift
        const currentShift = await prisma.dutyShift.findFirst({
            where: {
                officerId: userId,
                startTime: { lte: new Date() },
                OR: [
                    { endTime: null },
                    { endTime: { gte: new Date() } }
                ]
            },
            orderBy: { startTime: 'desc' }
        });

        if (!currentShift) {
            res.status(404).json({ error: 'no active shift found' });
            return;
        }

        const updatedShift = await prisma.dutyShift.update({
            where: { id: currentShift.id },
            data: {
                status: status as DutyStatus,
                location: location || currentShift.location,
                activities: activities ? (currentShift.activities ? `${currentShift.activities}\n${activities}` : activities) : currentShift.activities
            }
        });

        res.json({
            success: true,
            message: 'status updated',
            shift: updatedShift
        });
    } catch (error: any) {
        console.error('[update status error]', error);
        res.status(500).json({ error: 'failed to update status' });
    }
});

export default router;
