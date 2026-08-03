'use client';

interface FIRStatusCardProps {
  firNumber: string;
  status: string;
  stationName: string;
  submittedAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  INVESTIGATION: 'bg-yellow-100 text-yellow-700',
  CLOSED: 'bg-purple-100 text-purple-700',
};

export function FIRStatusCard({ firNumber, status, stationName, submittedAt }: FIRStatusCardProps) {
  return (
    <div className="rounded-[hsl(var(--radius-lg))] border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-raised))] p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-bold text-[hsl(var(--color-primary))]">
          {firNumber}
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-700'}`}>
          {status}
        </span>
      </div>
      <p className="mt-2 text-sm text-[hsl(var(--color-ink))]">{stationName}</p>
      <p className="text-xs text-[hsl(var(--color-ink-muted))]">
        Submitted: {new Date(submittedAt).toLocaleDateString('en-IN')}
      </p>
    </div>
  );
}
