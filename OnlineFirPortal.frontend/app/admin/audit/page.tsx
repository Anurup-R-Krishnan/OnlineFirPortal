'use client';

import { useState, useEffect } from 'react';

interface AuditEntry {
  id: string;
  timestamp: string;
  eventType: string;
  actor: string;
  details: string;
}

const MOCK_AUDIT: AuditEntry[] = [
  { id: '1', timestamp: '2026-08-03T10:30:00Z', eventType: 'FIR_CREATED', actor: 'citizen-001', details: 'FIR-2026-IN-00012345 filed via web portal' },
  { id: '2', timestamp: '2026-08-03T10:31:00Z', eventType: 'JURISDICTION_ROUTED', actor: 'system', details: 'Routed to City Central (confidence: 0.92)' },
  { id: '3', timestamp: '2026-08-03T10:31:05Z', eventType: 'TRIAGE_COMPLETED', actor: 'system', details: 'Priority: P2 (score: 30)' },
  { id: '4', timestamp: '2026-08-03T11:00:00Z', eventType: 'FIR_ACCEPTED', actor: 'officer-101', details: 'Accepted by SI Rajesh Kumar' },
];

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>(MOCK_AUDIT);
  const [filter, setFilter] = useState('');

  const filtered = filter
    ? entries.filter(e => e.eventType.includes(filter.toUpperCase()) || e.details.toLowerCase().includes(filter.toLowerCase()))
    : entries;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[hsl(var(--color-ink))]">Audit Log</h1>

      <input
        type="text"
        placeholder="Search audit entries..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
        className="w-full rounded-lg border border-[hsl(var(--color-border))] px-4 py-2 text-sm"
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--color-border))]">
              <th className="px-4 py-2 text-left text-[hsl(var(--color-ink-muted))]">Timestamp</th>
              <th className="px-4 py-2 text-left text-[hsl(var(--color-ink-muted))]">Event</th>
              <th className="px-4 py-2 text-left text-[hsl(var(--color-ink-muted))]">Actor</th>
              <th className="px-4 py-2 text-left text-[hsl(var(--color-ink-muted))]">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(entry => (
              <tr key={entry.id} className="border-b border-[hsl(var(--color-border))]">
                <td className="px-4 py-3 font-mono text-xs text-[hsl(var(--color-ink-muted))]">
                  {new Date(entry.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-[hsl(var(--color-primary-light))] px-2 py-0.5 text-xs font-medium text-[hsl(var(--color-primary))]">
                    {entry.eventType}
                  </span>
                </td>
                <td className="px-4 py-3 text-[hsl(var(--color-ink-muted))]">{entry.actor}</td>
                <td className="px-4 py-3 text-[hsl(var(--color-ink))]">{entry.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
