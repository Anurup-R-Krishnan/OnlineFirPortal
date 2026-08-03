import { describe, it, expect } from '@jest/globals';
import { createDeadline, checkDeadlines, SLADeadline } from '../../../src/lib/sla-engine';

describe('SLA Engine', () => {
  it('should create a deadline with correct targets for P0', () => {
    const deadline = createDeadline('fir-1', 'P0');
    expect(deadline.responseTargetHours).toBe(1);
    expect(deadline.resolutionTargetHours).toBe(24);
    expect(deadline.status).toBe('ACTIVE');
  });

  it('should create a deadline with correct targets for P4', () => {
    const deadline = createDeadline('fir-2', 'P4');
    expect(deadline.responseTargetHours).toBe(168); // 7 days
    expect(deadline.resolutionTargetHours).toBe(2160); // 90 days
  });

  it('should return OK status for recent deadlines', () => {
    const deadline: SLADeadline = {
      firId: 'fir-1',
      priority: 'P1',
      createdAt: new Date().toISOString(),
      responseTargetHours: 4,
      resolutionTargetHours: 72,
      status: 'ACTIVE',
    };

    const statuses = checkDeadlines([deadline]);
    expect(statuses).toHaveLength(1);
    expect(statuses[0].status).toBe('OK');
  });

  it('should return WARNING status for approaching deadlines', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    const deadline: SLADeadline = {
      firId: 'fir-1',
      priority: 'P1',
      createdAt: threeHoursAgo,
      responseTargetHours: 4,
      resolutionTargetHours: 72,
      status: 'ACTIVE',
    };

    const statuses = checkDeadlines([deadline]);
    expect(statuses[0].status).toBe('WARNING');
  });

  it('should return BREACHED status for overdue deadlines', () => {
    const fiveHoursAgo = new Date(Date.now() - 5 * 3600 * 1000).toISOString();
    const deadline: SLADeadline = {
      firId: 'fir-1',
      priority: 'P1',
      createdAt: fiveHoursAgo,
      responseTargetHours: 4,
      resolutionTargetHours: 72,
      status: 'ACTIVE',
    };

    const statuses = checkDeadlines([deadline]);
    expect(statuses[0].status).toBe('BREACHED');
  });
});
