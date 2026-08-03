'use client';

interface TriageIndicatorProps {
  priority: string;
  score?: number;
  factors?: Array<{
    name: string;
    weight: number;
    triggered: boolean;
    reason: string;
  }>;
}

const PRIORITY_LABELS: Record<string, string> = {
  P0: 'Immediate danger',
  P1: 'Urgent',
  P2: 'Standard',
  P3: 'Low priority',
  P4: 'Informational',
};

const PRIORITY_COLORS: Record<string, string> = {
  P0: 'bg-red-600 text-white',
  P1: 'bg-orange-500 text-white',
  P2: 'bg-yellow-500 text-white',
  P3: 'bg-blue-500 text-white',
  P4: 'bg-gray-400 text-white',
};

export function TriageIndicator({ priority, score, factors }: TriageIndicatorProps) {
  return (
    <div className="rounded-[hsl(var(--radius-md))] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-raised))] p-3">
      <div className="flex items-center gap-3">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${PRIORITY_COLORS[priority] || 'bg-gray-400 text-white'}`}>
          {priority}
        </span>
        <div>
          <p className="text-sm font-semibold text-[hsl(var(--color-ink))]">
            {PRIORITY_LABELS[priority] || priority}
          </p>
          {score !== undefined && (
            <p className="text-xs text-[hsl(var(--color-ink-muted))]">
              Score: {score}/130
            </p>
          )}
        </div>
      </div>
      {factors && factors.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-[hsl(var(--color-ink-muted))]">
          {factors.map((f) => (
            <li key={f.name} className={f.triggered ? 'text-[hsl(var(--color-danger))]' : ''}>
              {f.triggered ? '●' : '○'} {f.reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
