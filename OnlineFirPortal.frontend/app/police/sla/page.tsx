'use client';

import { useState, useEffect } from 'react';
import { getSLADashboard } from '../../../lib/api/sla';

interface SLAStatus {
  firId: string;
  priority: string;
  responseTargetHours: number;
  resolutionTargetHours: number;
  responseDeadline: string;
  resolutionDeadline: string;
  responseStatus: string;
  resolutionStatus: string;
}

export default function SLAMonitor() {
  const [statuses, setStatuses] = useState<SLAStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSLADashboard().then(data => {
      setStatuses(data || []);
      setLoading(false);
    });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'MET': return 'bg-[hsl(var(--color-success))]';
      case 'WARNING': return 'bg-[hsl(var(--color-warning))]';
      case 'BREACHED': return 'bg-[hsl(var(--color-danger))]';
      default: return 'bg-[hsl(var(--color-border))]';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[hsl(var(--color-ink))]">SLA Monitor</h1>

      {loading ? (
        <p className="text-[hsl(var(--color-ink-muted))]">Loading SLA data...</p>
      ) : statuses.length === 0 ? (
        <p className="text-[hsl(var(--color-ink-muted))]">No active SLA deadlines.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--color-border))]">
                <th className="px-4 py-2 text-left text-[hsl(var(--color-ink-muted))]">FIR</th>
                <th className="px-4 py-2 text-left text-[hsl(var(--color-ink-muted))]">Priority</th>
                <th className="px-4 py-2 text-left text-[hsl(var(--color-ink-muted))]">Response</th>
                <th className="px-4 py-2 text-left text-[hsl(var(--color-ink-muted))]">Resolution</th>
              </tr>
            </thead>
            <tbody>
              {statuses.map(s => (
                <tr key={s.firId} className="border-b border-[hsl(var(--color-border))]">
                  <td className="px-4 py-3 font-mono text-[hsl(var(--color-primary))]">{s.firId}</td>
                  <td className="px-4 py-3">{s.priority}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block h-2 w-2 rounded-full ${getStatusColor(s.responseStatus)} mr-2`} />
                    {s.responseStatus}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block h-2 w-2 rounded-full ${getStatusColor(s.resolutionStatus)} mr-2`} />
                    {s.resolutionStatus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
