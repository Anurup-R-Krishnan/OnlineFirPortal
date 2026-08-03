/**
 * Hash-Chained Event Ledger
 *
 * Tamper-evident event log using SHA-256 hash chaining.
 * Each event includes a hash of the previous event, creating an auditable chain.
 */

import { createHash } from 'crypto';

export interface LedgerEvent {
  eventId: string;
  caseId: string;
  sequenceNumber: number;
  eventType: string;
  timestamp: string;
  actorId: string;
  actorRole: string;
  payload: Record<string, unknown>;
  previousHash: string;
  currentHash: string;
}

export interface EventLedger {
  events: LedgerEvent[];
  caseId: string;
}

export interface VerificationResult {
  valid: boolean;
  brokenAt: number | null;
  totalEvents: number;
}

const GENESIS_HASH = '0'.repeat(64);

function canonicalize(data: Record<string, unknown>): string {
  // Recursively sort all object keys for deterministic hashing
  function sortKeys(obj: unknown): unknown {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sortKeys);
    return Object.keys(obj as Record<string, unknown>)
      .sort()
      .reduce((sorted, key) => {
        sorted[key] = sortKeys((obj as Record<string, unknown>)[key]);
        return sorted;
      }, {} as Record<string, unknown>);
  }
  return JSON.stringify(sortKeys(data));
}

function computeHash(event: Omit<LedgerEvent, 'currentHash'>): string {
  const content = canonicalize({
    eventId: event.eventId,
    caseId: event.caseId,
    sequenceNumber: event.sequenceNumber,
    eventType: event.eventType,
    timestamp: event.timestamp,
    actorId: event.actorId,
    actorRole: event.actorRole,
    payload: event.payload,
    previousHash: event.previousHash,
  });
  return createHash('sha256').update(content).digest('hex');
}

function generateEventId(): string {
  return createHash('sha256')
    .update(`${Date.now()}-${Math.random().toString(36).slice(2)}`)
    .digest('hex')
    .slice(0, 32);
}

export function recordEvent(
  ledger: EventLedger,
  data: {
    eventType: string;
    actorId: string;
    actorRole: string;
    payload: Record<string, unknown>;
  },
): LedgerEvent {
  const sequenceNumber = ledger.events.length + 1;
  const previousHash = ledger.events.length > 0
    ? ledger.events[ledger.events.length - 1].currentHash
    : GENESIS_HASH;

  const event: Omit<LedgerEvent, 'currentHash'> = {
    eventId: generateEventId(),
    caseId: ledger.caseId,
    sequenceNumber,
    eventType: data.eventType,
    timestamp: new Date().toISOString(),
    actorId: data.actorId,
    actorRole: data.actorRole,
    payload: data.payload,
    previousHash,
  };

  const currentHash = computeHash(event);
  const fullEvent: LedgerEvent = { ...event, currentHash };
  ledger.events.push(fullEvent);
  return fullEvent;
}

export function verifyChain(ledger: EventLedger): VerificationResult {
  for (let i = 0; i < ledger.events.length; i++) {
    const event = ledger.events[i];
    const expectedPrev = i === 0 ? GENESIS_HASH : ledger.events[i - 1].currentHash;

    if (event.previousHash !== expectedPrev) {
      return { valid: false, brokenAt: i, totalEvents: ledger.events.length };
    }

    const recomputed = computeHash({
      eventId: event.eventId,
      caseId: event.caseId,
      sequenceNumber: event.sequenceNumber,
      eventType: event.eventType,
      timestamp: event.timestamp,
      actorId: event.actorId,
      actorRole: event.actorRole,
      payload: event.payload,
      previousHash: event.previousHash,
    });

    if (recomputed !== event.currentHash) {
      return { valid: false, brokenAt: i, totalEvents: ledger.events.length };
    }
  }

  return { valid: true, brokenAt: null, totalEvents: ledger.events.length };
}
