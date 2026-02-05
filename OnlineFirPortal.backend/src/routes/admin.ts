import express, { Request, Response } from 'express';
import {
  listUsers,
  deleteUser,
  getAllFIRs,
  deleteFIR,
  listDocuments,
  deleteDocument,
  getReportSummary,
  getSettings,
  updateSettings
} from '../lib/db';
import { authenticateToken, requireRole } from '../lib/auth-middleware';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole(['admin']));

// GET /api/admin/users
router.get('/users', (_req: Request, res: Response) => {
  try {
    const users = listUsers();
    res.json(users);
  } catch (err: any) {
    console.error('[ADMIN USERS ERROR]', err);
    res.status(500).json({ error: err.message || 'Failed to load users' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const deleted = deleteUser(id);
    if (!deleted) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('[ADMIN DELETE USER ERROR]', err);
    res.status(500).json({ error: err.message || 'Failed to delete user' });
  }
});

// GET /api/admin/documents
router.get('/documents', (_req: Request, res: Response) => {
  try {
    const docs = listDocuments();
    res.json(docs);
  } catch (err: any) {
    console.error('[ADMIN DOCUMENTS ERROR]', err);
    res.status(500).json({ error: err.message || 'Failed to load documents' });
  }
});

// GET /api/admin/firs
router.get('/firs', (_req: Request, res: Response) => {
  try {
    const firs = getAllFIRs();
    res.json(firs);
  } catch (err: any) {
    console.error('[ADMIN FIRS ERROR]', err);
    res.status(500).json({ error: err.message || 'Failed to load FIRs' });
  }
});

// DELETE /api/admin/documents/:id
router.delete('/documents/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const deleted = deleteDocument(id);
    if (!deleted) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('[ADMIN DELETE DOCUMENT ERROR]', err);
    res.status(500).json({ error: err.message || 'Failed to delete document' });
  }
});

// DELETE /api/admin/firs/:id
router.delete('/firs/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const deleted = deleteFIR(id);
    if (!deleted) {
      res.status(404).json({ error: 'FIR not found' });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('[ADMIN DELETE FIR ERROR]', err);
    res.status(500).json({ error: err.message || 'Failed to delete FIR' });
  }
});

// GET /api/admin/reports/summary
router.get('/reports/summary', (_req: Request, res: Response) => {
  try {
    const summary = getReportSummary();
    res.json(summary);
  } catch (err: any) {
    console.error('[ADMIN REPORTS ERROR]', err);
    res.status(500).json({ error: err.message || 'Failed to load reports' });
  }
});

// GET /api/admin/settings
router.get('/settings', (_req: Request, res: Response) => {
  try {
    const settings = getSettings();
    res.json(settings);
  } catch (err: any) {
    console.error('[ADMIN SETTINGS ERROR]', err);
    res.status(500).json({ error: err.message || 'Failed to load settings' });
  }
});

// PUT /api/admin/settings
router.put('/settings', (req: Request, res: Response) => {
  try {
    const payload = req.body && typeof req.body === 'object' ? req.body : {};
    const updated = updateSettings(payload);
    res.json(updated);
  } catch (err: any) {
    console.error('[ADMIN SETTINGS UPDATE ERROR]', err);
    res.status(500).json({ error: err.message || 'Failed to update settings' });
  }
});

export default router;
