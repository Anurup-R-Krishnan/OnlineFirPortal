import { Router, Request, Response } from 'express';
import { createDeadline, checkDeadlines } from '../lib/sla-engine';
import { Priority } from '../lib/triage-engine';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const deadlines = await prisma.sLADeadline.findMany({
      where: { status: 'ACTIVE' },
    });

    const statuses = checkDeadlines(deadlines as any);
    res.json({ data: statuses });
  } catch (error) {
    console.error('SLA dashboard error:', error);
    res.status(500).json({ error: 'Failed to load SLA dashboard' });
  }
});

router.post('/create', async (req: Request, res: Response) => {
  try {
    const { firId, priority } = req.body;
    if (!firId || !priority) {
      res.status(400).json({ error: 'firId and priority are required' });
      return;
    }

    const deadline = createDeadline(firId, priority as Priority);

    await prisma.sLADeadline.create({
      data: {
        firId: deadline.firId,
        priority: deadline.priority,
        responseTargetHours: deadline.responseTargetHours,
        resolutionTargetHours: deadline.resolutionTargetHours,
        status: deadline.status,
      },
    });

    res.json({ data: deadline });
  } catch (error) {
    console.error('SLA create error:', error);
    res.status(500).json({ error: 'Failed to create SLA deadline' });
  }
});

router.patch('/:firId/extend', async (req: Request, res: Response) => {
  try {
    const { firId } = req.params;
    const { reason } = req.body;

    const deadline = await prisma.sLADeadline.findFirst({
      where: { firId, status: 'ACTIVE' },
    });

    if (!deadline) {
      res.status(404).json({ error: 'No active SLA deadline found for this FIR' });
      return;
    }

    // Pause current deadline
    await prisma.sLADeadline.update({
      where: { id: deadline.id },
      data: { status: 'PAUSED' },
    });

    // Create new deadline with extended time
    const newDeadline = createDeadline(firId, deadline.priority as Priority);
    await prisma.sLADeadline.create({
      data: {
        firId: newDeadline.firId,
        priority: newDeadline.priority,
        responseTargetHours: newDeadline.responseTargetHours,
        resolutionTargetHours: newDeadline.resolutionTargetHours,
        status: 'ACTIVE',
      },
    });

    res.json({ data: newDeadline, extended: true, reason });
  } catch (error) {
    console.error('SLA extend error:', error);
    res.status(500).json({ error: 'Failed to extend SLA deadline' });
  }
});

export default router;
