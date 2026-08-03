'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TrackFIR() {
  const [firNumber, setFirNumber] = useState('');

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-[hsl(var(--color-ink))]">Track Your FIR</h1>
      <p className="text-[hsl(var(--color-ink-muted))]">
        Enter your FIR number to check the current status and updates.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="e.g. FIR-2026-IN-00012345"
          value={firNumber}
          onChange={e => setFirNumber(e.target.value)}
          className="flex-1 rounded-lg border border-[hsl(var(--color-border))] px-4 py-2 text-sm"
        />
        <Link
          href={firNumber ? `/citizen/track/${encodeURIComponent(firNumber)}` : '#'}
          className={`rounded-lg px-4 py-2 text-sm text-white ${
            firNumber ? 'bg-[hsl(var(--color-primary))]' : 'bg-[hsl(var(--color-border))] cursor-not-allowed'
          }`}
        >
          Track
        </Link>
      </div>

      <div className="rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-raised))] p-4">
        <h2 className="font-semibold text-[hsl(var(--color-ink))]">Recent FIRs</h2>
        <ul className="mt-2 space-y-2 text-sm">
          <li className="flex items-center justify-between">
            <span className="font-mono text-[hsl(var(--color-primary))]">FIR-2026-IN-00012345</span>
            <span className="rounded bg-[hsl(var(--color-warning))] px-2 py-0.5 text-xs text-white">INVESTIGATION</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="font-mono text-[hsl(var(--color-primary))]">FIR-2026-IN-00012346</span>
            <span className="rounded bg-[hsl(var(--color-success))] px-2 py-0.5 text-xs text-white">ACCEPTED</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
