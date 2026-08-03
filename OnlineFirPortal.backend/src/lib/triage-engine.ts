/**
 * Deterministic Triage Engine
 *
 * Assigns priority levels (P0-P4) to FIR reports based on weighted factor scoring.
 * Versioned for audit trail compliance.
 */

export type Priority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';

export interface TriageInput {
  description: string;
  hasWeapon: boolean;
  hasInjury: boolean;
  ongoingIncident: boolean;
  vulnerablePerson: boolean;
  propertyDamage: boolean;
}

export interface TriageFactor {
  name: string;
  weight: number;
  triggered: boolean;
  reason: string;
}

export interface TriageResult {
  priority: Priority;
  score: number;
  factors: TriageFactor[];
  timestamp: string;
  version: string;
}

const TRIAGE_VERSION = '1.0';

interface FactorDefinition {
  name: string;
  weight: number;
  evaluate: (input: TriageInput) => { triggered: boolean; reason: string };
}

const FACTORS: FactorDefinition[] = [
  {
    name: 'ongoing_incident',
    weight: 40,
    evaluate: (input) => ({
      triggered: input.ongoingIncident,
      reason: input.ongoingIncident ? 'Incident is currently in progress' : 'No ongoing incident reported',
    }),
  },
  {
    name: 'weapon_involved',
    weight: 35,
    evaluate: (input) => ({
      triggered: input.hasWeapon,
      reason: input.hasWeapon ? 'Weapon reported in the incident' : 'No weapon reported',
    }),
  },
  {
    name: 'injury_present',
    weight: 30,
    evaluate: (input) => ({
      triggered: input.hasInjury,
      reason: input.hasInjury ? 'Injury or medical need reported' : 'No injury reported',
    }),
  },
  {
    name: 'vulnerable_person',
    weight: 20,
    evaluate: (input) => ({
      triggered: input.vulnerablePerson,
      reason: input.vulnerablePerson ? 'Child, elderly, or disabled person involved' : 'No vulnerable person identified',
    }),
  },
  {
    name: 'property_damage',
    weight: 5,
    evaluate: (input) => ({
      triggered: input.propertyDamage,
      reason: input.propertyDamage ? 'Property damage reported' : 'No property damage',
    }),
  },
];

/**
 * Map score to priority level
 */
function computePriority(score: number): Priority {
  if (score >= 70) return 'P0';
  if (score >= 45) return 'P1';
  if (score >= 25) return 'P2';
  if (score >= 10) return 'P3';
  return 'P4';
}

/**
 * Assess priority for a FIR report
 */
export function assessPriority(input: TriageInput): TriageResult {
  const factors: TriageFactor[] = FACTORS.map((f) => {
    const evalResult = f.evaluate(input);
    return {
      name: f.name,
      weight: f.weight,
      triggered: evalResult.triggered,
      reason: evalResult.reason,
    };
  });

  const score = factors.reduce((sum, f) => sum + (f.triggered ? f.weight : 0), 0);

  return {
    priority: computePriority(score),
    score,
    factors,
    timestamp: new Date().toISOString(),
    version: TRIAGE_VERSION,
  };
}
