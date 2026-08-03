'use client';

import { useState } from 'react';
import { FIRStatusCard } from '../../../components/domain/fir-status-card';
import { TriageIndicator } from '../../../components/domain/triage-indicator';

const MOCK_CASES = [
  { id: 'FIR-2026-IN-00012345', status: 'SUBMITTED', stationName: 'City Central', submittedAt: '2026-08-03T10:30:00Z', incidentType: 'Theft', priority: 'P2' as const, score: 30 },
  { id: 'FIR-2026-IN-00012346', status: 'INVESTIGATION', stationName: 'City Central', submittedAt: '2026-08-02T14:15:00Z', incidentType: 'Assault', priority: 'P1' as const, score: 55 },
  { id: 'FIR-2026-IN-00012347', status: 'ACCEPTED', stationName: 'Fort', submittedAt: '2026-08-01T09:00:00Z', incidentType: 'Burglary', priority: 'P2' as const, score: 35 },
];

type StatusFilter = 'ALL' | 'SUBMITTED' | 'ACCEPTED' | 'INVESTIGATION';

export default function CaseQueue() {
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const cases = filter === 'ALL' ? MOCK_CASES : MOCK_CASES.filter(c => c.status === filter);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[hsl(var(--color-ink))]">Case Queue</h1>

      <div className="flex gap-2">
        {(['ALL', 'SUBMITTED', 'ACCEPTED', 'INVESTIGATION'] as StatusFilter[]).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1 text-sm ${
              filter === s ? 'bg-[hsl(var(--color-primary))] text-white' : 'border border-[hsl(var(--color-border))] text-[hsl(var(--color-ink-muted))]'
            }`}>
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {cases.map(c => (
          <div key={c.id} className="flex items-start gap-4 rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-raised))] p-4">
            <FIRStatusCard firNumber={c.id} status={c.status as any} stationName={c.stationName} submittedAt={c.submittedAt} />
            <TriageIndicator priority={c.priority} score={c.score} factors={[]} />
          </div>
        ))}
      </div>
    </div>
  );
}
