"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../lib/db");
const auth_middleware_1 = require("../lib/auth-middleware");
const router = express_1.default.Router();
// Middleware to ensure all FIR routes are authenticated
router.use(auth_middleware_1.authenticateToken);
// GET /api/firs
router.get('/', (req, res) => {
    try {
        const user = req.user;
        const list = (0, db_1.getAllFIRs)();
        // Filter based on role
        if (user.role === 'citizen') {
            const userFirs = list.filter((fir) => fir.reporterId === user.userId);
            res.json(userFirs);
            return;
        }
        // Police/Admin get all
        res.json(list);
    }
    catch (err) {
        console.error('[GET FIRS ERROR]', err);
        res.status(500).json({ error: err.message });
    }
});
// POST /api/firs
router.post('/', (req, res) => {
    try {
        const user = req.user;
        // Authorize
        const authResult = (0, auth_middleware_1.checkPermission)(user, 'fir', 'create');
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
        const created = (0, db_1.createFIR)(body);
        res.status(201).json(created);
    }
    catch (err) {
        console.error('[CREATE FIR ERROR]', err);
        res.status(500).json({ error: err.message || 'Unknown error' });
    }
});
// GET /api/firs/:id
router.get('/:id', (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const fir = (0, db_1.getFIRById)(id);
        if (!fir) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        const authResult = (0, auth_middleware_1.checkPermission)(user, 'fir', 'read', fir.reporterId);
        if (!authResult.allowed) {
            res.status(403).json({ error: authResult.error });
            return;
        }
        res.json(fir);
    }
    catch (err) {
        console.error('[GET FIR ERROR]', err);
        res.status(500).json({ error: err.message });
    }
});
// PATCH /api/firs/:id
router.patch('/:id', async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const fir = (0, db_1.getFIRById)(id);
        if (!fir) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        const authResult = (0, auth_middleware_1.checkPermission)(user, 'fir', 'update', fir.reporterId);
        if (!authResult.allowed) {
            res.status(403).json({ error: authResult.error });
            return;
        }
        const body = req.body;
        const { status, assignedOfficerId, officerName, policeStation, reason, performedBy, note } = body;
        let updated;
        if (status) {
            if (status === 'rejected') {
                updated = (0, db_1.updateFIRStatus)(id, 'rejected', (performedBy || user.email), reason ? `Rejected: ${reason}` : 'Rejected');
            }
            else {
                updated = (0, db_1.updateFIRStatus)(id, status, (performedBy || user.email), note || '');
            }
        }
        else if (assignedOfficerId) {
            // Check assign permission
            const assignResult = (0, auth_middleware_1.checkPermission)(user, 'fir', 'assign', fir.reporterId);
            if (!assignResult.allowed) {
                res.status(403).json({ error: assignResult.error });
                return;
            }
            updated = (0, db_1.assignOfficer)(id, assignedOfficerId, officerName, policeStation, (performedBy || user.email));
        }
        if (!updated) {
            res.status(400).json({ error: 'Update failed' });
            return;
        }
        res.json(updated);
    }
    catch (err) {
        console.error('[PATCH FIR ERROR]', err);
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=firs.js.map