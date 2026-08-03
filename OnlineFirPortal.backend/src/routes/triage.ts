import { Router, Request, Response } from 'express';
import { assessPriority, TriageInput } from '../lib/triage-engine';
import { getAdvisory, LMStudioConfig } from '../lib/lm-studio-client';
import { prisma } from '../lib/prisma';

const router = Router();

const lmStudioConfig: LMStudioConfig = {
  baseUrl: process.env.LM_STUDIO_URL || 'http://localhost:1234',
  model: process.env.LM_STUDIO_MODEL || 'local-model',
  timeoutMs: Number(process.env.LM_STUDIO_TIMEOUT_MS) || 10000,
};

router.post('/assess', async (req: Request, res: Response) => {
  try {
    const { firId } = req.body;
    if (!firId) {
      res.status(400).json({ error: 'firId is required' });
      return;
    }

    const fir = await prisma.fIR.findUnique({ where: { id: firId } });
    if (!fir) {
      res.status(404).json({ error: 'FIR not found' });
      return;
    }

    const input: TriageInput = {
      description: fir.description || '',
      hasWeapon: Boolean((fir as any).hasWeapon),
      hasInjury: Boolean((fir as any).hasInjury),
      ongoingIncident: Boolean((fir as any).ongoingIncident),
      vulnerablePerson: Boolean((fir as any).vulnerablePerson),
      propertyDamage: Boolean((fir as any).propertyDamage),
    };

    const triageResult = assessPriority(input);

    // Attempt LM Studio advisory (non-blocking)
    let advisory = null;
    try {
      advisory = await getAdvisory(input, lmStudioConfig);
    } catch {
      // Advisory failure is non-fatal
    }

    res.json({
      data: {
        ...triageResult,
        advisory,
      },
    });
  } catch (error) {
    console.error('Triage assessment error:', error);
    res.status(500).json({ error: 'Internal error during triage assessment' });
  }
});

export default router;
