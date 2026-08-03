const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface TriageInput {
  description: string;
  hasWeapon: boolean;
  hasInjury: boolean;
  ongoingIncident: boolean;
  vulnerablePerson: boolean;
  propertyDamage: boolean;
}

export interface TriageResult {
  priority: string;
  score: number;
  factors: Array<{
    name: string;
    weight: number;
    triggered: boolean;
    reason: string;
  }>;
}

export async function assessTriage(firId: string, input: TriageInput): Promise<TriageResult> {
  const res = await fetch(`${API_BASE}/api/triage/${firId}/assess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Triage assessment failed');
  const { data } = await res.json();
  return data;
}
