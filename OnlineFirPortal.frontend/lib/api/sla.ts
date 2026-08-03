const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface SLAStatus {
  firId: string;
  priority: string;
  status: 'OK' | 'WARNING' | 'BREACHED';
  responseElapsedPercent: number;
  resolutionElapsedPercent: number;
}

export async function getSLADashboard(): Promise<SLAStatus[]> {
  const res = await fetch(`${API_BASE}/api/sla/dashboard`);
  const { data } = await res.json();
  return data;
}

export async function extendDeadline(firId: string, reason: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/sla/${firId}/extend`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
}
