const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface JurisdictionResult {
  stationId: string;
  stationName: string;
  confidence: number;
  method: 'polygon_match' | 'nearest_station';
  explanation: string;
  alternatives: Array<{
    stationId: string;
    stationName: string;
    distance: number;
    confidence: number;
  }>;
}

export async function routeJurisdiction(params: {
  address?: string;
  lat?: number;
  lng?: number;
  firId?: string;
}): Promise<JurisdictionResult> {
  const res = await fetch(`${API_BASE}/api/jurisdiction/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || 'Jurisdiction routing failed');
  }
  const { data } = await res.json();
  return data;
}
