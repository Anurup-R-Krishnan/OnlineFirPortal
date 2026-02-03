import express, { Request, Response } from 'express';
import {
    getAllFIRs,
    createFIR,
    getFIRById,
    updateFIRStatus,
    assignOfficer
} from '../lib/db';
import {
    authenticateToken,
    checkPermission,
    requireRole
} from '../lib/auth-middleware';

const router = express.Router();

// Middleware to ensure all FIR routes are authenticated
router.use(authenticateToken);

// GET /api/firs
router.get('/', (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const list = getAllFIRs();

        // Filter based on role
        if (user.role === 'citizen') {
            const userFirs = list.filter((fir: any) => fir.reporterId === user.userId);
            res.json(userFirs);
            return;
        }

        // Police/Admin get all
        res.json(list);
    } catch (err: any) {
        console.error('[GET FIRS ERROR]', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/firs
router.post('/', (req: Request, res: Response) => {
    try {
        const user = req.user!;

        // Authorize
        const authResult = checkPermission(user, 'fir', 'create');
        if (!authResult.allowed) {
            res.status(403).json({ error: authResult.error });
            return;
        }

        const body = req.body;
        if (!body) {
            res.status(400).json({ error: 'Body required' });
            return;
        }

        // Add reporter info
        body.complainantId = user.userId;
        body.reporterId = user.userId;
        body.complainantName = user.name || user.email; // Ensure actor is set

        const created = createFIR(body);
        res.status(201).json(created);
    } catch (err: any) {
        console.error('[CREATE FIR ERROR]', err);
        res.status(500).json({ error: err.message || 'Unknown error' });
    }
});

// GET /api/firs/:id
router.get('/:id', (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const { id } = req.params as { id: string };

        const fir = getFIRById(id);
        if (!fir) {
            res.status(404).json({ error: 'Not found' });
            return;
        }

        const authResult = checkPermission(user, 'fir', 'read', fir.reporterId);
        if (!authResult.allowed) {
            res.status(403).json({ error: authResult.error });
            return;
        }

        res.json(fir);
    } catch (err: any) {
        console.error('[GET FIR ERROR]', err);
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/firs/:id
router.patch('/:id', async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const { id } = req.params as { id: string };

        const fir = getFIRById(id);
        if (!fir) {
            res.status(404).json({ error: 'Not found' });
            return;
        }

        const authResult = checkPermission(user, 'fir', 'update', fir.reporterId);
        if (!authResult.allowed) {
            res.status(403).json({ error: authResult.error });
            return;
        }

        const body = req.body;
        const { status, assignedOfficerId, officerName, policeStation, reason, performedBy, note } = body;

        let updated;
        if (status) {
            if (status === 'rejected') {
                updated = updateFIRStatus(id, 'rejected', (performedBy || user.email) as string, reason ? `Rejected: ${reason}` : 'Rejected');
            } else {
                updated = updateFIRStatus(id, status as string, (performedBy || user.email) as string, note as string || '');
            }
        } else if (assignedOfficerId) {
            // Check assign permission
            const assignResult = checkPermission(user, 'fir', 'assign', fir.reporterId);
            if (!assignResult.allowed) {
                res.status(403).json({ error: assignResult.error });
                return;
            }
            updated = assignOfficer(id, assignedOfficerId as string, officerName as string, policeStation as string, (performedBy || user.email) as string);
        }

        if (!updated) {
            res.status(400).json({ error: 'Update failed' });
            return;
        }
        res.json(updated);

    } catch (err: any) {
        console.error('[PATCH FIR ERROR]', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
