/**
 * SLA/Deadline Engine
 *
 * Manages per-priority response and resolution deadlines.
 * Detects approaching warnings (75% threshold) and breaches.
 */

import { Priority } from './triage-engine';

export interface SLADeadline {
  firId: string;
  priority: Priority;
  createdAt: string;
  responseTargetHours: number;
  resolutionTargetHours: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'BREACHED';
}

export interface SLAStatus {
  firId: string;
  priority: Priority;
  status: 'OK' | 'WARNING' | 'BREACHED';
  responseElapsedPercent: number;
  resolutionElapsedPercent: number;
}

const SLA_TARGETS: Record<Priority, { responseHours: number; resolutionHours: number }> = {
  P0: { responseHours: 1, resolutionHours: 24 },
  P1: { responseHours: 4, resolutionHours: 72 },
  P2: { responseHours: 24, resolutionHours: 15 * 24 },
  P3: { responseHours: 72, resolutionHours: 30 * 24 },
  P4: { responseHours: 7 * 24, resolutionHours: 90 * 24 },
};

const WARNING_THRESHOLD = 0.75;

export function createDeadline(firId: string, priority: Priority): SLADeadline {
  const targets = SLA_TARGETS[priority];
  return {
    firId,
    priority,
    createdAt: new Date().toISOString(),
    responseTargetHours: targets.responseHours,
    resolutionTargetHours: targets.resolutionHours,
    status: 'ACTIVE',
  };
}

export function checkDeadlines(deadlines: SLADeadline[]): SLAStatus[] {
  const now = Date.now();

  return deadlines
    .filter(d => d.status === 'ACTIVE')
    .map(d => {
      const created = new Date(d.createdAt).getTime();
      const elapsedMs = now - created;
      const responseElapsedPercent = (elapsedMs / (d.responseTargetHours * 3600 * 1000)) * 100;
      const resolutionElapsedPercent = (elapsedMs / (d.resolutionTargetHours * 3600 * 1000)) * 100;

      let status: 'OK' | 'WARNING' | 'BREACHED';
      if (responseElapsedPercent >= 100) {
        status = 'BREACHED';
      } else if (responseElapsedPercent >= WARNING_THRESHOLD * 100) {
        status = 'WARNING';
      } else {
        status = 'OK';
      }

      return {
        firId: d.firId,
        priority: d.priority,
        status,
        responseElapsedPercent,
        resolutionElapsedPercent,
      };
    });
}
