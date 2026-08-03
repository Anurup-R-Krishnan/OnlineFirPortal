/**
 * LM Studio Advisory Client
 *
 * Connects to a local LM Studio instance for AI-assisted triage analysis.
 * Returns null on any failure — advisory is never blocking.
 */

import { TriageInput } from './triage-engine';

export interface LMStudioConfig {
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

export interface AdvisoryResult {
  riskAssessment: string;
  suggestedActions: string[];
  confidence: number;
  reasoning: string;
  raw: string;
}

const ADVISORY_SCHEMA = {
  type: 'object',
  required: ['riskAssessment', 'suggestedActions', 'confidence', 'reasoning'],
  properties: {
    riskAssessment: { type: 'string' },
    suggestedActions: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    reasoning: { type: 'string' },
  },
};

function validateSchema(data: unknown): data is Omit<AdvisoryResult, 'raw'> {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (typeof obj.riskAssessment !== 'string') return false;
  if (!Array.isArray(obj.suggestedActions)) return false;
  if (typeof obj.confidence !== 'number') return false;
  if (typeof obj.reasoning !== 'string') return false;
  return true;
}

export async function getAdvisory(
  input: TriageInput,
  config: LMStudioConfig,
): Promise<AdvisoryResult | null> {
  const prompt = `You are a police triage advisory system. Analyze this incident report and provide a structured assessment.

Incident: ${input.description}
Weapon reported: ${input.hasWeapon}
Injury reported: ${input.hasInjury}
Ongoing incident: ${input.ongoingIncident}
Vulnerable person: ${input.vulnerablePerson}
Property damage: ${input.propertyDamage}

Respond ONLY with valid JSON matching this schema:
${JSON.stringify(ADVISORY_SCHEMA, null, 2)}`;

  try {
    const res = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      }),
      signal: AbortSignal.timeout(config.timeoutMs),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') return null;

    const parsed = JSON.parse(content);
    if (!validateSchema(parsed)) return null;

    return { ...parsed, raw: content };
  } catch {
    return null;
  }
}
