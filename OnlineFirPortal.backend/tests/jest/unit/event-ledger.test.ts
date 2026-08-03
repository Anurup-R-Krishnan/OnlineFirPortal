import { describe, it, expect } from '@jest/globals';
import { recordEvent, verifyChain, EventLedger } from '../../../src/lib/event-ledger';

describe('Event Ledger', () => {
  it('should record an event with proper hash chaining', () => {
    const ledger: EventLedger = { events: [], caseId: 'case-1' };

    const event1 = recordEvent(ledger, {
      eventType: 'FIR_SUBMITTED',
      actorId: 'citizen-1',
      actorRole: 'citizen',
      payload: { description: 'Theft reported' },
    });

    expect(event1.sequenceNumber).toBe(1);
    expect(event1.previousHash).toBe('0'.repeat(64));
    expect(event1.currentHash).toHaveLength(64);

    const event2 = recordEvent(ledger, {
      eventType: 'FIR_ACCEPTED',
      actorId: 'officer-1',
      actorRole: 'police',
      payload: { station: 'City Central' },
    });

    expect(event2.sequenceNumber).toBe(2);
    expect(event2.previousHash).toBe(event1.currentHash);
  });

  it('should verify a valid chain', () => {
    const ledger: EventLedger = { events: [], caseId: 'case-1' };

    recordEvent(ledger, {
      eventType: 'FIR_SUBMITTED',
      actorId: 'citizen-1',
      actorRole: 'citizen',
      payload: { description: 'Theft reported' },
    });

    recordEvent(ledger, {
      eventType: 'FIR_ACCEPTED',
      actorId: 'officer-1',
      actorRole: 'police',
      payload: { station: 'City Central' },
    });

    const result = verifyChain(ledger);
    expect(result.valid).toBe(true);
    expect(result.totalEvents).toBe(2);
  });

  it('should detect tampered events', () => {
    const ledger: EventLedger = { events: [], caseId: 'case-1' };

    recordEvent(ledger, {
      eventType: 'FIR_SUBMITTED',
      actorId: 'citizen-1',
      actorRole: 'citizen',
      payload: { description: 'Theft reported' },
    });

    // Tamper with the event
    ledger.events[0].payload = { description: 'HACKED' };

    const result = verifyChain(ledger);
    expect(result.valid).toBe(false);
    expect(result.brokenAt).toBe(0);
  });

  it('should verify an empty chain as valid', () => {
    const ledger: EventLedger = { events: [], caseId: 'case-1' };
    const result = verifyChain(ledger);
    expect(result.valid).toBe(true);
    expect(result.totalEvents).toBe(0);
  });
});
