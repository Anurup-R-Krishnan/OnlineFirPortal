import { describe, it, expect, vi, beforeEach } from '@jest/globals';
import { getAdvisory, LMStudioConfig } from '../../../src/lib/lm-studio-client';
import { TriageInput } from '../../../src/lib/triage-engine';

const defaultConfig: LMStudioConfig = {
  baseUrl: 'http://localhost:1234',
  model: 'local-model',
  timeoutMs: 5000,
};

const mockInput: TriageInput = {
  description: 'Armed robbery in progress',
  hasWeapon: true,
  hasInjury: false,
  ongoingIncident: true,
  vulnerablePerson: false,
  propertyDamage: false,
};

describe('getAdvisory', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return advisory on successful response', async () => {
    const advisoryResponse = {
      riskAssessment: 'High risk - armed and ongoing',
      suggestedActions: ['Dispatch immediate unit', 'Secure perimeter'],
      confidence: 0.85,
      reasoning: 'Weapon involvement with ongoing incident requires immediate response',
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(advisoryResponse) } }],
      }),
    }));

    const result = await getAdvisory(mockInput, defaultConfig);
    expect(result).not.toBeNull();
    expect(result!.riskAssessment).toBe('High risk - armed and ongoing');
    expect(result!.suggestedActions).toHaveLength(2);
    expect(result!.confidence).toBe(0.85);
  });

  it('should return null on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

    const result = await getAdvisory(mockInput, defaultConfig);
    expect(result).toBeNull();
  });

  it('should return null on invalid JSON response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'not valid json' } }],
      }),
    }));

    const result = await getAdvisory(mockInput, defaultConfig);
    expect(result).toBeNull();
  });

  it('should return null on schema validation failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ invalid: 'schema' }) } }],
      }),
    }));

    const result = await getAdvisory(mockInput, defaultConfig);
    expect(result).toBeNull();
  });
});
