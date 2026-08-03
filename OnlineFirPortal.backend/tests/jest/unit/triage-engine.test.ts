import { describe, it, expect } from '@jest/globals';
import { assessPriority, TriageInput } from '../../../src/lib/triage-engine';

describe('assessPriority', () => {
  it('should assign P0 for immediate danger with weapon', () => {
    const input: TriageInput = {
      description: 'Armed robbery in progress, attacker has knife',
      hasWeapon: true,
      hasInjury: false,
      ongoingIncident: true,
      vulnerablePerson: false,
      propertyDamage: false,
    };
    const result = assessPriority(input);
    expect(result.priority).toBe('P0');
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it('should assign P1 for urgent incidents with injury', () => {
    const input: TriageInput = {
      description: 'Physical assault with injuries',
      hasWeapon: false,
      hasInjury: true,
      ongoingIncident: true,
      vulnerablePerson: false,
      propertyDamage: false,
    };
    const result = assessPriority(input);
    expect(result.priority).toBe('P1');
    expect(result.score).toBeGreaterThanOrEqual(45);
    expect(result.score).toBeLessThan(70);
  });

  it('should assign P2 for property crimes', () => {
    const input: TriageInput = {
      description: 'Burglary reported at residence',
      hasWeapon: false,
      hasInjury: false,
      ongoingIncident: false,
      vulnerablePerson: false,
      propertyDamage: true,
    };
    const result = assessPriority(input);
    expect(result.priority).toBe('P2');
    expect(result.score).toBeGreaterThanOrEqual(25);
    expect(result.score).toBeLessThan(45);
  });

  it('should assign P4 for low-priority incidents', () => {
    const input: TriageInput = {
      description: 'Minor noise complaint',
      hasWeapon: false,
      hasInjury: false,
      ongoingIncident: false,
      vulnerablePerson: false,
      propertyDamage: false,
    };
    const result = assessPriority(input);
    expect(result.priority).toBe('P4');
    expect(result.score).toBe(0);
  });

  it('should include all factors in the result', () => {
    const input: TriageInput = {
      description: 'Test incident',
      hasWeapon: false,
      hasInjury: false,
      ongoingIncident: false,
      vulnerablePerson: false,
      propertyDamage: false,
    };
    const result = assessPriority(input);
    expect(result.factors).toHaveLength(5);
    expect(result.version).toBe('1.0');
    expect(result.timestamp).toBeDefined();
  });
});
